import { useEffect, useMemo, useRef, useState } from 'react';
import CubeView from '../three/CubeView.jsx';
import { applyMoves, applyMove, parseAlg } from '../core/cube.js';
import { describeMove } from '../core/notation.js';
import { buildState, stickersAt } from '../learn/build.js';

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

export function trackFocus(focus, moves) {
  if (!focus.length) return [];
  let mark = new Uint8Array(54);
  focus.forEach((i) => { mark[i] = 1; });
  for (const t of moves) mark = applyMove(mark, 3, t);
  const out = [];
  mark.forEach((v, i) => { if (v) out.push(i); });
  return out;
}

const SPEED = 620;

/**
 * Kartu kasus: kubus dalam keadaan kasus + tombol putar langkah demi langkah.
 * c: { title, parts:[{label, moves}], result, focus, view, ...keadaan untuk buildState }
 */
export default function CaseCard({ c, num }) {
  const start = useMemo(() => buildState(c), [c]);
  const groups = useMemo(() => (c.parts || []).map((p) => ({ label: p.label, moves: parseAlg(p.moves) })), [c]);
  const moves = useMemo(() => groups.flatMap((g) => g.moves), [groups]);
  const focus0 = useMemo(() => stickersAt(c.focus || []), [c]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const playRef = useRef(false);
  const shown = useMemo(() => Array.from(applyMoves(start, 3, moves.slice(0, i))), [start, moves, i]);
  const focus = useMemo(() => trackFocus(focus0, moves.slice(0, i)), [focus0, moves, i]);
  useEffect(() => () => { playRef.current = false; }, []);

  const stop = () => { playRef.current = false; setPlaying(false); };
  const jump = (k) => { stop(); ref.current?.finishNow(); ref.current?.setState(applyMoves(start, 3, moves.slice(0, k))); ref.current?.setFocus(trackFocus(focus0, moves.slice(0, k))); setI(k); };
  const play = async () => {
    if (playRef.current) { stop(); return; }
    let k = i;
    if (k >= moves.length) { jump(0); await new Promise((r) => setTimeout(r, 450)); k = 0; }
    playRef.current = true; setPlaying(true);
    while (playRef.current && k < moves.length) {
      setI(k + 1);
      await ref.current?.move(moves[k], SPEED, trackFocus(focus0, moves.slice(0, k + 1)));
      k++;
      await new Promise((r) => setTimeout(r, 140));
    }
    playRef.current = false; setPlaying(false);
  };
  const one = async () => {
    if (playRef.current || i >= moves.length) return;
    const k = i;
    setI(k + 1);
    await ref.current?.move(moves[k], SPEED, trackFocus(focus0, moves.slice(0, k + 1)));
  };

  const done = moves.length > 0 && i >= moves.length;
  const cur = i > 0 && !done ? moves[i - 1] : null;
  let offset = 0;

  return (
    <article className="case-card">
      <header className="case-head">
        <span className="case-num" aria-hidden="true">{num}</span>
        <h4>{c.title}</h4>
      </header>
      <LazyMount height={210} className="case-cube">
        <CubeView ref={ref} N={3} state={shown} focus={focus} view={c.view || 'front'} dim={0.4} zoom={1.3} />
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
        {cur ? <><b>{cur}</b><span>{describeMove(cur, 3).text}</span></> : done ? <><b>✓</b><span>{c.result}</span></> : <span>Lihat keping yang menyala, lalu tekan Putar.</span>}
      </div>
      <div className="case-controls">
        <button className="btn small" onClick={() => jump(0)} aria-label="Ulang dari awal">↺ Ulang</button>
        <button className="btn small primary" onClick={play}>{playing ? '⏸ Jeda' : done ? '▶ Putar lagi' : '▶ Putar'}</button>
        <button className="btn small" onClick={one} disabled={done}>Satu ▸</button>
      </div>
    </article>
  );
}
