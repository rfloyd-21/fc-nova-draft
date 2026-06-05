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
      <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center',color:'white'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>⚽️</div>
          <p style={{color:'#a0aec0',fontFamily:'sans-serif',fontWeight:600}}>Connecting to locker room...</p>
        </div>
      </div>
    );
  }

  const themes: any = {
    metal: {
      bg: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b4e 100%)',
      card: 'rgba(255,255,255,0.05)',
      border: '#9333ea',
      accent: '#ec4899',
      text: '#f0e6ff',
      btn: 'linear-gradient(90deg, #ec4899, #9333ea)',
      font: '"Courier New", monospace',
      emoji: '🎸',
    },
    lounge: {
      bg: 'linear-gradient(135deg, #2c1a0e 0%, #4a2c0a 100%)',
      card: 'rgba(255,220,150,0.08)',
      border: '#d97706',
      accent: '#f59e0b',
      text: '#fef3c7',
      btn: 'linear-gradient(90deg, #d97706, #b45309)',
      font: 'Georgia, serif',
      emoji: '🎷',
    },
    cigar: {
      bg: 'linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)',
      card: 'rgba(255,255,255,0.04)',
      border: '#525252',
      accent: '#a3a3a3',
      text: '#e5e5e5',
      btn: 'linear-gradient(90deg, #404040, #262626)',
      font: 'Georgia, serif',
      emoji: '🥃',
    },
    soccer: {
      bg: 'linear-gradient(135deg, #1a3a1a 0%, #2d5a1b 50%, #1a3a1a 100%)',
      card: 'rgba(255,255,255,0.07)',
      border: '#4ade80',
      accent: '#86efac',
      text: '#f0fdf4',
      btn: 'linear-gradient(90deg, #16a34a, #15803d)',
      font: '"Arial Black", sans-serif',
      emoji: '⚽️',
    },
    lasers: {
      bg: 'linear-gradient(135deg, #000000 0%, #0a0a2e 100%)',
      card: 'rgba(34,211,238,0.05)',
      border: '#22d3ee',
      accent: '#67e8f9',
      text: '#ecfeff',
      btn: 'linear-gradient(90deg, #0891b2, #0e7490)',
      font: '"Courier New", monospace',
      emoji: '🔮',
    },
  };

  const t = themes[state.theme.id] || themes.soccer;

  const cardStyle = {
    background: t.card,
    border: `1px solid ${t.border}`,
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
  };

  const btnStyle = {
    background: t.btn,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '13px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    width: '100%',
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: `1px solid ${t.border}`,
    borderRadius: '8px',
    padding: '10px 14px',
    color: t.text,
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  };

  const iAmFinished = myRole === 'red' ? state.redFinished : state.blueFinished;
  const partnerFinished = myRole === 'red' ? state.blueFinished : state.redFinished;

  return (
    <div style={{minHeight:'100vh',background:t.bg,fontFamily:t.font,color:t.text,padding:'24px 16px',maxWidth:'480px',margin:'0 auto'}}>
      
      {/* Header */}
      <div style={{textAlign:'center',marginBottom:'28px'}}>
        <div style={{fontSize:'40px',marginBottom:'8px'}}>{t.emoji}</div>
        <h1 style={{fontSize:'22px',fontWeight:900,letterSpacing:'0.05em',textTransform:'uppercase',margin:'0 0 4px 0',color:'white'}}>FC Nova Cidade Oeste</h1>
        <p style={{fontSize:'11px',color:t.accent,margin:'0 0 12px 0',letterSpacing:'0.1em',textTransform:'uppercase'}}>Weekly Draft Board</p>
        <div style={{display:'inline-block',background:'rgba(255,255,255,0.1)',border:`1px solid ${t.border}`,borderRadius:'20px',padding:'4px 14px',fontSize:'12px',color:t.accent}}>
          ✨ {state.theme.name}
        </div>
      </div>

      {/* SETUP */}
      {state.status === 'setup' && (
        <div style={cardStyle}>
          <h2 style={{textAlign:'center',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:t.accent,marginBottom:'20px'}}>Captain Registration</h2>
          
          <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'12px',padding:'14px',marginBottom:'12px'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:'#f87171',textTransform:'uppercase',marginBottom:'10px'}}>🔴 {state.theme.redTeamName}</p>
            {state.redCaptain ? (
              <p style={{fontSize:'14px',color:'white'}}>✅ <strong>{state.redCaptain}</strong> checked in</p>
            ) : myRole === 'blue' ? (
              <p style={{fontSize:'12px',color:'#9ca3af',fontStyle:'italic'}}>Waiting for captain...</p>
            ) : (
              <div style={{display:'flex',gap:'8px'}}>
                <input style={inputStyle} placeholder="Your name" value={redNameInput} onChange={e => setRedNameInput(e.target.value)} />
                <button onClick={() => handleRegister('red')} style={{...btnStyle,width:'auto',background:'#dc2626',whiteSpace:'nowrap',padding:'10px 14px'}}>Claim Red</button>
              </div>
            )}
          </div>

          <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'12px',padding:'14px'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:'#60a5fa',textTransform:'uppercase',marginBottom:'10px'}}>🔵 {state.theme.blueTeamName}</p>
            {state.blueCaptain ? (
              <p style={{fontSize:'14px',color:'white'}}>✅ <strong>{state.blueCaptain}</strong> checked in</p>
            ) : myRole === 'red' ? (
              <p style={{fontSize:'12px',color:'#9ca3af',fontStyle:'italic'}}>Send link to partner...</p>
            ) : (
              <div style={{display:'flex',gap:'8px'}}>
                <input style={inputStyle} placeholder="Your name" value={blueNameInput} onChange={e => setBlueNameInput(e.target.value)} />
                <button onClick={() => handleRegister('blue')} style={{...btnStyle,width:'auto',background:'#2563eb',whiteSpace:'nowrap',padding:'10px 14px'}}>Claim Blue</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COIN FLIP */}
      {state.status === 'coinflip' && (
        <div style={{...cardStyle,textAlign:'center',padding:'40px 20px'}}>
          <p style={{fontSize:'14px',color:t.accent,marginBottom:'24px'}}>{state.redCaptain} ⚔️ {state.blueCaptain}</p>
          <div style={{width:'120px',height:'120px',borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'4px solid #fbbf24',margin:'0 auto 28px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'40px',animation:isFlipping?'spin 0.5s linear infinite':'none'}}>
            ⚽️
          </div>
          <button onClick={handleCoinFlip} disabled={isFlipping} style={btnStyle}>
            {isFlipping ? 'Flipping...' : '🪙 Flip Coin'}
          </button>
        </div>
      )}

      {/* DRAFT STYLE */}
      {state.status === 'style' && (
        <div style={cardStyle}>
          <div style={{background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:'10px',padding:'12px',marginBottom:'20px',textAlign:'center'}}>
            <p style={{fontSize:'13px',fontWeight:700,color:'#fbbf24'}}>
              🏆 {state.coinFlipResult === 'red' ? state.redCaptain : state.blueCaptain} won the flip and picks first!
            </p>
          </div>
          <h2 style={{textAlign:'center',fontSize:'11px',letterSpacing:'0.15em',textTransform:'uppercase',color:t.accent,marginBottom:'16px'}}>Choose Draft Style</h2>
          <div style={{display:'flex',flexDirection:'column' as const,gap:'10px'}}>
            <button onClick={() => runAction('set_draft_style', { style: 'snake' })} style={{background:'rgba(255,255,255,0.05)',border:`1px solid ${t.border}`,borderRadius:'12px',padding:'16px',textAlign:'left' as const,cursor:'pointer',color:t.text}}>
              <p style={{fontWeight:700,fontSize:'15px',margin:'0 0 4px 0'}}>🐍 Snake Draft</p>
              <p style={{fontSize:'11px',color:t.accent,margin:'0 0 2px 0'}}>1 → 2 → 2 → 1 → 1 → 2 → 2 → 1...</p>
              <p style={{fontSize:'11px',color:'#6b7280',margin:0}}>Classic fantasy sports format</p>
            </button>
            <button onClick={() => runAction('set_draft_style', { style: 'alternating' })} style={{background:'rgba(255,255,255,0.05)',border:`1px solid ${t.border}`,borderRadius:'12px',padding:'16px',textAlign:'left' as const,cursor:'pointer',color:t.text}}>
              <p style={{fontWeight:700,fontSize:'15px',margin:'0 0 4px 0'}}>🔄 Alternating Draft</p>
              <p style={{fontSize:'11px',color:t.accent,margin:'0 0 2px 0'}}>1 → 2 → 2 → 1 → 2 → 1 → 2 → 1...</p>
              <p style={{fontSize:'11px',color:'#6b7280',margin:0}}>Pair at the start, then strict alternating</p>
            </button>
          </div>
        </div>
      )}

      {/* DRAFTING + FINISHING */}
      {(state.status === 'drafting' || state.status === 'finishing' || state.status === 'finished') && (
        <div>
          {state.status === 'drafting' && (
            <div style={{...cardStyle,textAlign:'center',padding:'14px'}}>
              {state.turn === myRole ? (
                <p style={{fontSize:'14px',fontWeight:700,color:'#4ade80',margin:0}}>🔥 Your turn! Pick below.</p>
              ) : (
                <p style={{fontSize:'13px',color:t.accent,margin:0}}>⏳ Waiting on {state.turn === 'red' ? state.redCaptain : state.blueCaptain}...</p>
              )}
              <p style={{fontSize:'10px',color:'#6b7280',margin:'4px 0 0 0'}}>
                {state.draftStyle === 'snake' ? '🐍 Snake' : '🔄 Alternating'} Draft
              </p>
            </div>
          )}

          {state.status === 'drafting' && state.turn === myRole && (
            <form onSubmit={handlePick} style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
              <input style={inputStyle} placeholder="Type player full name..." value={playerInput} onChange={e => { setPlayerInput(e.target.value); setPickError(''); }} required />
              <button type="submit" style={{...btnStyle,width:'auto',whiteSpace:'nowrap',padding:'10px 18px'}}>Draft</button>
            </form>
          )}
          {pickError && <p style={{fontSize:'12px',color:'#f87171',marginBottom:'12px'}}>{pickError}</p>}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            <div style={cardStyle}>
              <div style={{textAlign:'center',borderBottom:`1px solid ${t.border}`,paddingBottom:'10px',marginBottom:'10px'}}>
                <p style={{fontSize:'11px',fontWeight:900,color:'#f87171',textTransform:'uppercase',margin:'0 0 2px 0'}}>{state.theme.redTeamName}</p>
                <p style={{fontSize:'10px',color:'#6b7280',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Cap: {state.redCaptain}</p>
              </div>
              <ul style={{listStyle:'none',padding:0,margin:0,minHeight:'120px'}}>
                {shuffledRed.map((p: any) => (
                  <li key={p.id} style={{fontSize:'12px',fontWeight:600,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'6px',padding:'6px 8px',marginBottom:'6px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>• {p.player}</li>
                ))}
              </ul>
            </div>
            <div style={cardStyle}>
              <div style={{textAlign:'center',borderBottom:`1px solid ${t.border}`,paddingBottom:'10px',marginBottom:'10px'}}>
                <p style={{fontSize:'11px',fontWeight:900,color:'#60a5fa',textTransform:'uppercase',margin:'0 0 2px 0'}}>{state.theme.blueTeamName}</p>
                <p style={{fontSize:'10px',color:'#6b7280',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Cap: {state.blueCaptain}</p>
              </div>
              <ul style={{listStyle:'none',padding:0,margin:0,minHeight:'120px'}}>
                {shuffledBlue.map((p: any) => (
                  <li key={p.id} style={{fontSize:'12px',fontWeight:600,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'6px',padding:'6px 8px',marginBottom:'6px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>• {p.player}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
            {state.status === 'drafting' && state.picks.length > 0 && state.picks[state.picks.length - 1].team === myRole && (
              <button onClick={() => runAction('undo')} style={{flex:1,background:'rgba(255,255,255,0.05)',border:`1px solid ${t.border}`,borderRadius:'10px',padding:'10px',color:t.text,fontWeight:700,cursor:'pointer',fontSize:'12px'}}>
                ↩ Undo
              </button>
            )}
