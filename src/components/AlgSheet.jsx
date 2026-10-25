import { useEffect, useMemo, useRef, useState } from 'react';
import CubeView from '../three/CubeView.jsx';
import { applyMoves, solvedState, invertAlg, parseAlg } from '../core/cube.js';
import { describeMove } from '../core/notation.js';

// Lembar demo: menampilkan kasus, lalu memutar rumus sampai kubus kembali rapi
export default function AlgSheet({ N, alg, title, note, onClose }) {
  const toks = useMemo(() => parseAlg(alg), [alg]);
  const start = useMemo(() => Array.from(applyMoves(solvedState(N), N, invertAlg(toks))), [N, toks]);
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const alive = useRef(true);
  const playRef = useRef(false);

  const reset = () => { playRef.current = false; setPlaying(false); ref.current?.finishNow(); ref.current?.setState(start); setI(0); };
  const play = async () => {
    if (playRef.current) { playRef.current = false; setPlaying(false); return; }
    let k = i;
    if (k >= toks.length) { reset(); await new Promise((r) => setTimeout(r, 350)); k = 0; }
    playRef.current = true; setPlaying(true);
    while (playRef.current && alive.current && k < toks.length) {
      setI(k + 1);
      await ref.current?.move(toks[k], 380);
      k++;
      await new Promise((r) => setTimeout(r, 60));
    }
    playRef.current = false; setPlaying(false);
  };
  const stepOnce = async () => { if (i < toks.length && !playRef.current) { setI(i + 1); await ref.current?.move(toks[i], 380); } };

  useEffect(() => {
    alive.current = true;
    const t = setTimeout(() => { play(); }, 700);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { alive.current = false; playRef.current = false; clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nowTok = i > 0 ? toks[i - 1] : null;
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="topbar">
          <div className="title"><h2>{title}</h2>{note && <small>{note}</small>}</div>
          <button className="btn icon-btn" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="stage-cube" style={{ height: 260 }}>
          <CubeView ref={ref} N={N} state={start} labels />
        </div>
        <div className="moves">
          {toks.map((t, k) => <button key={k} className={k < i - 1 ? 'done' : k === i - 1 ? 'now' : ''} onClick={() => { playRef.current = false; setPlaying(false); ref.current?.finishNow(); ref.current?.setState(applyMoves(start, N, toks.slice(0, k + 1))); setI(k + 1); }}>{t}</button>)}
        </div>
        <div className="move-meaning">{nowTok ? <><b>{nowTok}</b><span>{describeMove(nowTok, N).text}</span></> : <span>Ini kasus yang diselesaikan rumus ini. Tekan putar!</span>}</div>
        <div className="action-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <button className="btn" onClick={reset}>↺ Ulang</button>
          <button className="btn primary" onClick={play}>{playing ? '⏸ Jeda' : '▶ Putar'}</button>
          <button className="btn" onClick={stepOnce}>Satu ▸</button>
        </div>
      </div>
    </div>
  );
}
