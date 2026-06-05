import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const THEMES = [
  { id: 'metal', name: '80s Hair Metal', redTeamName: 'Red Rebels', blueTeamName: 'Blue' },
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
    picks: [],
    status: 'setup',
    turn: null,
    draftStyle: null,
    redFinished: false,
    blueFinished: false,
  };
}

function getNextTurn(
  pickCount: number,
  firstPicker: string,
  draftStyle: string
): string {
  const second = firstPicker === 'red' ? 'blue' : 'red';

  if (draftStyle === 'snake') {
    const pos = pickCount % 4;
    return (pos === 0 || pos === 3) ? firstPicker : second;
  }

  // Alternating: 1 2 2 1 2 1 2 1 2 ...
  if (pickCount === 0) return firstPicker;
  if (pickCount === 1) return second;
  if (pickCount === 2) return second;
  return (pickCount % 2 === 1) ? firstPicker : second;
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
      state.status = 'style';
    }

    else if (action === 'set_draft_style') {
      state.draftStyle = payload.style;
      state.status = 'drafting';
    }

    else if (action === 'pick_player') {
      const alreadyPicked = state.picks.some(
        (p: any) => p.player.toLowerCase() === payload.player.toLowerCase()
      );
      if (alreadyPicked) {
        return NextResponse.json({ ...state, error: 'Player already picked!' });
      }

      const newPick = {
        id: Date.now().toString(),
        player: payload.player,
        team: state.turn,
        captain: state.turn === 'red' ? state.redCaptain : state.blueCaptain,
      };
      state.picks.push(newPick);
      state.turn = getNextTurn(state.picks.length, state.coinFlipResult, state.draftStyle);
    }

    else if (action === 'undo') {
      if (state.picks.length > 0) {
        const removedPick = state.picks.pop();
        state.turn = removedPick.team;
        if (state.status === 'finished' || state.status === 'finishing') {
          state.status = 'drafting';
          state.redFinished = false;
          state.blueFinished = false;
        }
      }
    }

    else if (action === 'captain_finish') {
      if (payload.team === 'red') state.redFinished = true;
      if (payload.team === 'blue') state.blueFinished = true;

      if (state.redFinished && state.blueFinished) {
        state.status = 'finished';
        state.turn = null;
      } else {
        state.status = 'finishing';
      }
    }

    await kv.set('nova_draft_state', state);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}
