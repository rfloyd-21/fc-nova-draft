'use client';

import { useState, useEffect } from 'react';

export default function DraftPage() {
  const [state, setState] = useState<any>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [redNameInput, setRedNameInput] = useState('');
  const [blueNameInput, setBlueNameInput] = useState('');
  const [playerInput, setPlayerInput] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [pickError, setPickError] = useState('');
  const [shuffledRed, setShuffledRed] = useState<any[]>([]);
  const [shuffledBlue, setShuffledBlue] = useState<any[]>([]);

  useEffect(() => {
    const savedRole = localStorage.getItem('fc_nova_role');
    if (savedRole) setMyRole(savedRole);
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state && state.picks) {
      const redPicks = state.picks.filter((p: any) => p.team === 'red');
      const bluePicks = state.picks.filter((p: any) => p.team === 'blue');
      setShuffledRed([...redPicks].sort((a: any, b: any) => a.player.localeCompare(b.player)));
      setShuffledBlue([...bluePicks].sort((a: any, b: any) => a.player.localeCompare(b.player)));
    }
  }, [state]);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/draft');
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error('Error loading state', err);
    }
  };

  const runAction = async (action: string, payload: any = {}) => {
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      setState(data);
      return data;
    } catch (err) {
      console.error('Error executing action', err);
    }
  };

  const handleRegister = async (role: 'red' | 'blue') => {
    const name = role === 'red' ? redNameInput.trim() : blueNameInput.trim();
    if (!name) return;
    localStorage.setItem('fc_nova_role', role);
    setMyRole(role);
    await runAction(`register_${role}`, { name });
    if (role === 'red') setRedNameInput('');
    else setBlueNameInput('');
  };

  const handleCoinFlip = () => {
    setIsFlipping(true);
    setTimeout(async () => {
      await runAction('flip_coin');
      setIsFlipping(false);
    }, 2000);
  };

  const handlePick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerInput.trim()) return;
    setPickError('');
    const data = await runAction('pick_player', { player: playerInput.trim() });
    if (data?.error) {
      setPickError(data.error);
    } else {
      setPlayerInput('');
    }
  };

  const handleFinish = async () => {
    if (!myRole) return;
    if (!confirm('Are you sure you want to lock your side of the draft?')) return;
    await runAction('captain_finish', { team: myRole });
  };

  const handleWhatsAppCopy = () => {
    if (!state) return;
    const styleLabel = state.draftStyle === 'snake' ? '🐍 Snake' : '🔄 Alternating';
    const text = `⚽️ FC Nova Cidade Oeste Lineup ⚽️\n🎭 Theme: ${state.theme.name}\n📋 Draft Style: ${styleLabel}\n\n🔴 ${state.theme.redTeamName.toUpperCase()} (${state.redCaptain}):\n${shuffledRed.map((p: any) => ` • ${p.player}`).join('\n')}\n\n🔵 ${state.theme.blueTeamName.toUpperCase()} (${state.blueCaptain}):\n${shuffledBlue.map((p: any) => ` • ${p.player}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    alert('Lineup copied! Ready to paste into WhatsApp.');
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Connecting to locker room...</p>
      </div>
    );
  }

  const themeStyles: any = {
    metal: { bg: 'bg-zinc-50', card: 'border-2 border-purple-500', btn: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white', font: 'font-mono' },
    lounge: { bg: 'bg-amber-50/30', card: 'border-2 border-amber-600 bg-amber-50/50', btn: 'bg-orange-600 text-white', font: 'font-serif' },
    cigar: { bg: 'bg-slate-100', card: 'border-2 border-slate-800 bg-white shadow-sm', btn: 'bg-slate-800 text-white', font: 'font-serif' },
    soccer: { bg: 'bg-stone-100', card: 'border-4 border-double border-stone-700 bg-orange-50/10', btn: 'bg-stone-800 text-stone-100', font: 'font-sans tracking-tight font-bold' },
    lasers: { bg: 'bg-white', card: 'border-2 border-cyan-400 border-dashed', btn: 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]', font: 'font-mono' },
  };
  const currentStyle = themeStyles[state.theme.id] || themeStyles.soccer;

  const iAmFinished = myRole === 'red' ? state.redFinished : state.blueFinished;
  const partnerFinished = myRole === 'red' ? state.blueFinished : state.redFinished;

  return (
    <div className={`min-h-screen ${currentStyle.bg} ${currentStyle.font} text-slate-800 px-4 py-6 max-w-md mx-auto flex flex-col justify-between`}>
      <header className="text-center mb-6">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">FC Nova Cidade Oeste</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Weekly Draft Board</p>
        <div className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 text-xs rounded-full shadow-xs">
          Vibe: <span className="underline decoration-indigo-400 font-bold">{state.theme.name}</span>
        </div>
      </header>

      <main className="flex-grow">

        {/* SETUP */}
        {state.status === 'setup' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 text-center">Captain Registration</h2>

            <div className="p-3 border rounded-lg bg-red-50/30 border-red-100">
              <p className="text-xs font-bold text-red-600 uppercase mb-2">🔴 {state.theme.redTeamName}</p>
              {state.redCaptain ? (
                <p className="text-sm font-semibold text-slate-700">Checked In: <span className="font-bold">{state.redCaptain}</span></p>
              ) : myRole === 'blue' ? (
                <p className="text-xs italic text-slate-400">Waiting for other captain...</p>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="Your name" value={redNameInput} onChange={e => setRedNameInput(e.target.value)} className="border px-3 py-2 text-sm rounded-md w-full bg-white text-slate-800" />
                  <button onClick={() => handleRegister('red')} className="bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-md whitespace-nowrap">Claim Red</button>
                </div>
              )}
            </div>

            <div className="p-3 border rounded-lg bg-blue-50/30 border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase mb-2">🔵 {state.theme.blueTeamName}</p>
              {state.blueCaptain ? (
                <p className="text-sm font-semibold text-slate-700">Checked In: <span className="font-bold">{state.blueCaptain}</span></p>
              ) : myRole === 'red' ? (
                <p className="text-xs italic text-slate-400">Send link to partner...</p>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="Your name" value={blueNameInput} onChange={e => setBlueNameInput(e.target.value)} className="border px-3 py-2 text-sm rounded-md w-full bg-white text-slate-800" />
                  <button onClick={() => handleRegister('blue')} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-md whitespace-nowrap">Claim Blue</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COIN FLIP */}
        {state.status === 'coinflip' && (
          <div className="text-center py-10 space-y-6">
            <p className="text-sm font-semibold text-slate-600">{state.redCaptain} 🆚 {state.blueCaptain}</p>
            <div className="flex justify-center my-4">
              <div className={`w-28 h-28 rounded-full bg-amber-400 border-4 border-amber-500 shadow-md flex items-center justify-center font-black text-amber-900 text-lg ${isFlipping ? 'animate-spin' : ''}`}>
                ⚽️ COIN
              </div>
            </div>
            <button onClick={handleCoinFlip} disabled={isFlipping} className={`w-full py-3 rounded-lg font-bold uppercase text-sm tracking-wider shadow-sm transition ${currentStyle.btn}`}>
              {isFlipping ? 'Flipping...' : 'Flip Coin'}
            </button>
          </div>
        )}

        {/* DRAFT STYLE SELECTION */}
        {state.status === 'style' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 text-center">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-bold text-amber-800">
                🏆 {state.coinFlipResult === 'red' ? state.redCaptain : state.blueCaptain} won the coin flip and picks first!
              </p>
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Choose Draft Style</h2>
            <div className="space-y-3">
              <button onClick={() => runAction('set_draft_style', { style: 'snake' })} className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <p className="font-bold text-slate-800">🐍 Snake Draft</p>
                <p className="text-xs text-slate-500 mt-1">1 → 2 → 2 → 1 → 1 → 2 → 2 → 1...</p>
                <p className="text-xs text-slate-400 mt-0.5">Classic fantasy sports format</p>
              </button>
              <button onClick={() => runAction('set_draft_style', { style: 'alternating' })} className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-left">
                <p className="font-bold text-slate-800">🔄 Alternating Draft</p>
                <p className="text-xs text-slate-500 mt-1">1 → 2 → 2 → 1 → 2 → 1 → 2 → 1...</p>
                <p className="text-xs text-slate-400 mt-0.5">Pair at the start, then strict alternating</p>
              </button>
            </div>
          </div>
        )}

        {/* DRAFTING + FINISHING */}
        {(state.status === 'drafting' || state.status === 'finishing' || state.status === 'finished') && (
          <div className="space-y-5">

            {state.status === 'drafting' && (
              <div className="text-center p-3 rounded-lg border bg-white shadow-xs">
                {state.turn === myRole ? (
                  <div className="animate-pulse text-sm font-bold text-emerald-600">🔥 Your turn! Pick below.</div>
                ) : (
                  <div className="text-sm font-semibold text-slate-500">
                    ⏳ Waiting on {state.turn === 'red' ? state.redCaptain : state.blueCaptain}...
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Style: {state.draftStyle === 'snake' ? '🐍 Snake' : '🔄 Alternating'}
                </p>
              </div>
            )}

            {state.status === 'drafting' && state.turn === myRole && (
              <form onSubmit={handlePick} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type player full name..."
                  value={playerInput}
                  onChange={e => { setPlayerInput(e.target.value); setPickError(''); }}
                  className="border border-slate-300 px-3 py-3 text-sm rounded-lg w-full bg-white text-slate-800 font-medium"
                  required
                />
                <button type="submit" className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider ${currentStyle.btn}`}>
                  Lock
                </button>
              </form>
            )}
            {pickError && <p className="text-xs text-red-500 font-semibold -mt-3">{pickError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                <div className="text-center border-b pb-2 mb-2">
                  <p className="text-xs font-black text-red-600 uppercase tracking-tight">{state.theme.redTeamName}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">Cap: {state.redCaptain}</p>
                </div>
                <ul className="space-y-1.5 min-h-[150px]">
                  {shuffledRed.map((p: any) => (
                    <li key={p.id} className="text-xs font-semibold bg-slate-50 border border-slate-100 p-2 rounded-md truncate text-slate-700">• {p.player}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                <div className="text-center border-b pb-2 mb-2">
                  <p className="text-xs font-black text-blue-600 uppercase tracking-tight">{state.theme.blueTeamName}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">Cap: {state.blueCaptain}</p>
                </div>
                <ul className="space-y-1.5 min-h-[150px]">
                  {shuffledBlue.map((p: any) => (
                    <li key={p.id} className="text-xs font-semibold bg-slate-50 border border-slate-100 p-2 rounded-md truncate text-slate-700">• {p.player}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {state.status === 'drafting' &&
                state.picks.length > 0 &&
                state.picks[state.picks.length - 1].team === myRole && (
                  <button
                    onClick={() => runAction('undo')}
                    className="w-1/2 border border-slate-300 bg-white text-slate-600 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-xs hover:bg-slate-50"
                  >
                    ↩ Undo Last Pick
                  </button>
                )}

              {(state.status === 'drafting' || state.status === 'finishing') &&
                state.picks.length >= 2 &&
                !iAmFinished && (
                  <button
                    onClick={handleFinish}
                    className="w-full bg-slate-900 text-white font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider shadow-xs ml-auto"
                  >
                    🏁 Lock My Side
                  </button>
                )}
            </div>

            {state.status === 'finishing' && iAmFinished && !partnerFinished && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-700">⏳ Waiting for {myRole === 'red' ? state.blueCaptain : state.redCaptain} to lock their side...</p>
              </div>
            )}

            {state.status === 'finished' && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center space-y-3">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">🏆 Draft Complete & Locked!</p>
                <button onClick={handleWhatsAppCopy} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-lg text-xs uppercase tracking-wider shadow-sm transition">
                  Copy to WhatsApp 📲
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-8 pt-4 border-t border-slate-200/60 text-center">
        <button
          onClick={() => { if (confirm('Permanently wipe current state?')) runAction('reset'); }}
          className="text-[10px] uppercase font-bold tracking-widest text-slate-300 hover:text-red-400 transition"
        >
          ☢ Manual System Reset
        </button>
      </footer>
    </div>
  );
}
