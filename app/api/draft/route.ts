import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const THEMES = [
  { id: 'metal', name: '80s Hair Metal', redTeamName: 'Red Rebels', blueTeamName: 'Blue Blueÿe' },
  { id: 'lounge', name: '70s Lounge', redTeamName: 'Red Velvet', blueTeamName: 'Blue Silk' },
  { id: 'cigar', name: '1920s Cigar Club', redTeamName: 'Red Cognac', blueTeamName: 'Blue Bourbons' },
  { id: 'soccer', name: '70s Vintage Soccer', redTeamName: 'Red Athletic', blueTeamName: 'Blue United' },
  { id: 'lasers', name: 'Lasers', redTeamName: 'Red Lasers', blueTeamName: 'Blue Phasers' }
];

async function getInitialState() {
  const defaultTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  return {
    theme: defaultTheme,
    redCaptain: '',
    blueCaptain: '',
    coinFlipResult: null,
    isSpinning: false,
    picks: [], 
    status: 'setup', 
    turn: null 
  };
}

export async function GET() {
  try {
    let state: any = await kv.get('nova_draft_state');
    if (!state) {
      state = await getInitialState();
      await kv.set('nova_draft_state', state);
    }
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    let state: any = await kv.get('nova_draft_state');
    
    if (!state) state = await getInitialState();

    if (action === 'reset') {
      state = await getInitialState();
    } 
    else if (action === 'register_red') {
      state.redCaptain = payload.name;
      if (state.blueCaptain) state.status = 'coinflip';
    } 
    else if (action === 'register_blue') {
      state.blueCaptain = payload.name;
      if (state.redCaptain) state.status = 'coinflip';
    } 
    else if (action === 'flip_coin') {
      const winner = Math.random() < 0.5 ? 'red' : 'blue';
      state.coinFlipResult = winner;
      state.turn = winner;
      state.status = 'drafting';
    } 
    else if (action === 'pick_player') {
      const newPick = {
        id: Date.now().toString(),
        player: payload.player,
        team: state.turn,
        captain: state.turn === 'red' ? state.redCaptain : state.blueCaptain
      };
      state.picks.push(newPick);
      
      const pickCount = state.picks.length;
      const firstPicker = state.coinFlipResult;
      const secondPicker = firstPicker === 'red' ? 'blue' : 'red';

      if (pickCount === 1) {
        state.turn = secondPicker;
      } else {
        const cycleIndex = Math.floor((pickCount - 1) / 2);
        if (cycleIndex % 2 === 0) {
          state.turn = secondPicker;
        } else {
          state.turn = firstPicker;
        }
      }
    } 
    else if (action === 'undo') {
      if (state.picks.length > 0) {
        const removedPick = state.picks.pop();
        state.turn = removedPick.team;
        if (state.status === 'finished') {
          state.status = 'drafting';
        }
      }
    } 
    else if (action === 'finish') {
      state.status = 'finished';
      state.turn = null;
    }

    await kv.set('nova_draft_state', state);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}
