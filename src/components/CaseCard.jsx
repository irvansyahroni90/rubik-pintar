import { useEffect, useMemo, useRef, useState } from 'react';
import CubeView from '../three/CubeView.jsx';
import { applyMoves, applyMove, parseAlg } from '../core/cube.js';
import { describeMove } from '../core/notation.js';
import { buildState, caseFocus } from '../learn/build.js';

// Pasang kubus 3D hanya saat terlihat di layar (hemat memori HP)
export function LazyMount({ height, className = '', children }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '240px 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={'lazy ' + className} style={{ height }}>{on ? children : null}</div>;
}

export function trackFocus(focus, moves, N = 3) {
  if (!focus.length) return [];
  let mark = new Uint8Array(6 * N * N);
  focus.forEach((i) => { mark[i] = 1; });
  for (const t of moves) mark = applyMove(mark, N, t);
  const out = [];
  mark.forEach((v, i) => { if (v) out.push(i); });
  return out;
}

const VIEWS = ['front', 'bottom', 'back'];
const VIEW_LABEL = { front: 'Lihat bawah', bottom: 'Lihat belakang', back: 'Lihat depan' };

/**
 * Kartu kasus: kubus dalam keadaan kasus + tombol putar langkah demi langkah.
 * c: { N?, title, parts:[{label, moves}], result, view, ...keadaan untuk buildState }
 */
export default function CaseCard({ c, num }) {
  const N = c.N || 3;
  const speed = N >= 4 ? 700 : 620;
  const start = useMemo(() => buildState(c), [c]);
  const groups = useMemo(() => (c.parts || []).map((p) => ({ label: p.label, moves: parseAlg(p.moves) })), [c]);
  const moves = useMemo(() => groups.flatMap((g) => g.moves), [groups]);
  const focus0 = useMemo(() => caseFocus(c), [c]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState(c.view || 'front');
  const ref = useRef(null);
  const playRef = useRef(false);
  const shown = useMemo(() => Array.from(applyMoves(start, N, moves.slice(0, i))), [start, moves, i, N]);
  const focus = useMemo(() => trackFocus(focus0, moves.slice(0, i), N), [focus0, moves, i, N]);
  useEffect(() => () => { playRef.current = false; }, []);

  const stop = () => { playRef.current = false; setPlaying(false); };
  const jump = (k) => { stop(); ref.current?.finishNow(); ref.current?.setState(applyMoves(start, N, moves.slice(0, k))); ref.current?.setFocus(trackFocus(focus0, moves.slice(0, k), N)); setI(k); };
  const play = async () => {
    if (playRef.current) { stop(); return; }
    let k = i;
    if (k >= moves.length) { jump(0); await new Promise((r) => setTimeout(r, 450)); k = 0; }
    playRef.current = true; setPlaying(true);
    while (playRef.current && k < moves.length) {
      setI(k + 1);
      await ref.current?.move(moves[k], speed, trackFocus(focus0, moves.slice(0, k + 1), N));
      k++;
      await new Promise((r) => setTimeout(r, 140));
    }
    playRef.current = false; setPlaying(false);
  };
  const one = async () => {
    if (playRef.current || i >= moves.length) return;
    const k = i;
    setI(k + 1);
    await ref.current?.move(moves[k], speed, trackFocus(focus0, moves.slice(0, k + 1), N));
  };
  const nextView = () => setView(VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length]);

  const done = moves.length > 0 && i >= moves.length;
  const cur = i > 0 && !done ? moves[i - 1] : null;
  let offset = 0;

  return (
    <article className="case-card">
      <header className="case-head">
        <span className="case-num" aria-hidden="true">{num}</span>
        <h4>{c.title}</h4>
      </header>
      <LazyMount height={N >= 4 ? 230 : 210} className="case-cube">
        <CubeView ref={ref} N={N} state={shown} focus={focus} view={view} dim={0.4} zoom={1.3} />
        <button className="btn small case-view" onClick={nextView}>🔄 {VIEW_LABEL[view] || 'Lihat depan'}</button>
      </LazyMount>
      <div className="case-parts">
        {groups.map((g, gi) => {
          const from = offset; offset += g.moves.length;
          return (
            <div key={gi} className="case-part">
              <span className="case-part-label">{g.label}</span>
              <div className="moves">
                {g.moves.map((t, k) => {
                  const idx = from + k;
                  return <button key={k} className={idx < i - 1 || (done && idx < i) ? 'done' : idx === i - 1 ? 'now' : ''} onClick={() => jump(idx + 1)} aria-label={`Gerakan ${t}`}>{t}</button>;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="move-meaning">
        {cur ? <><b>{cur}</b><span>{describeMove(cur, N).text}</span></> : done ? <><b>✓</b><span>{c.result}</span></> : <span>Lihat keping yang menyala, lalu tekan Putar. Kubus bisa digeser untuk melihat sisi lain.</span>}
      </div>
      <div className="case-controls">
        <button className="btn small" onClick={() => jump(0)} aria-label="Ulang dari awal">↺ Ulang</button>
        <button className="btn small primary" onClick={play}>{playing ? '⏸ Jeda' : done ? '▶ Putar lagi' : '▶ Putar'}</button>
        <button className="btn small" onClick={one} disabled={done}>Satu ▸</button>
      </div>
    </article>
  );
}
