import { useEffect, useMemo, useRef } from 'react';
import CubeView from '../three/CubeView.jsx';
import { solvedState, invertAlg } from '../core/cube.js';
import { Logo, SizePicker } from './common.jsx';

const IDLE = { 2: ['R', 'U', "F'", 'R2', "U'", 'F'], 3: ['R', 'U', "R'", 'F', "U'", 'L', 'D', "B'"], 4: ['Rw', 'U', "2R'", 'F', "Uw'", 'L'], 5: ['Rw', '3U', "R'", 'F', "2D'", 'L'] };

function HeroCube({ N }) {
  const ref = useRef(null);
  const start = useMemo(() => solvedState(N), [N]);
  useEffect(() => {
    let alive = true;
    const seq = [...IDLE[N], ...invertAlg(IDLE[N])];
    let i = 0;
    const tick = async () => {
      if (!alive) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce && ref.current && !document.hidden) await ref.current.move(seq[i % seq.length], 420);
      i++;
      if (alive) setTimeout(tick, i % seq.length === 0 ? 1600 : 260);
    };
    const t = setTimeout(tick, 900);
    return () => { alive = false; clearTimeout(t); };
  }, [N]);
  return (
    <div className="stage-cube hero-cube">
      <CubeView key={N} ref={ref} N={N} state={start} autoRotate />
    </div>
  );
}

export default function Home({ N, setN, result, pos, onScan, onManual, onPractice, onResume }) {
  const total = result ? result.stages.reduce((a, s) => a + s.steps.reduce((b, st) => b + st.moves.length, 0), 0) : 0;
  return (
    <main className="screen">
      <div className="brand"><Logo /><h1>Rubik Pintar</h1></div>
      <div className="hello">
        <h1>Ayo selesaikan rubikmu!</h1>
        <p>Foto keenam sisinya, lalu ikuti animasi langkah demi langkah sampai beres.</p>
      </div>
      <SizePicker N={N} setN={setN} />
      <HeroCube N={N} />
      <div className="action-stack">
        <button className="btn primary block" onClick={onScan}><span className="ico" aria-hidden="true">📷</span>Scan rubik {N}x{N}-ku</button>
        <div className="action-row">
          <button className="btn" onClick={onManual}><span className="ico" aria-hidden="true">🎨</span>Isi warna manual</button>
          <button className="btn" onClick={onPractice}><span className="ico" aria-hidden="true">🎲</span>Latihan acak</button>
        </div>
      </div>
      {result && (
        <div className="resume">
          <div className="txt">
            <b>Lanjutkan solusi {result.N}x{result.N}</b>
            <span>{Math.min(pos, total)} dari {total} gerakan sudah dilakukan</span>
          </div>
          <button className="btn blue small" onClick={onResume}>Lanjutkan</button>
        </div>
      )}
    </main>
  );
}
