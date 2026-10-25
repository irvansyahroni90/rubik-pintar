import { useMemo, useRef, useState } from 'react';
import CubeView from '../three/CubeView.jsx';
import { solvedState } from '../core/cube.js';
import { describeMove, NOTATION_GROUPS } from '../core/notation.js';
import { SizePicker } from './common.jsx';

export default function Notation() {
  const [N, setN] = useState(3);
  const [last, setLast] = useState(null);
  const ref = useRef(null);
  const start = useMemo(() => solvedState(N), [N]);
  const groups = NOTATION_GROUPS(N);
  const tap = (t) => { setLast(t); ref.current?.move(t, 450); };
  return (
    <main className="screen">
      <div>
        <h1>Notasi gerakan</h1>
        <p className="muted" style={{ marginTop: 6 }}>Ketuk huruf untuk melihat gerakannya. Arah selalu dibaca seolah kamu menatap sisi itu langsung.</p>
      </div>
      <SizePicker N={N} setN={(n) => { setN(n); setLast(null); }} />
      <div className="stage-cube" style={{ height: 280 }}>
        <CubeView key={N} ref={ref} N={N} state={start} labels />
      </div>
      <div className="move-meaning">{last ? <><b>{last}</b><span>{describeMove(last, N).text}</span></> : <span>Huruf = sisi (R kanan, L kiri, U atas, D bawah, F depan, B belakang). Aksen ' = kebalikan, 2 = dua kali.</span>}</div>
      {groups.map((g) => (
        <section key={g.title} className="list">
          <h3>{g.title}</h3>
          <div className="note-grid">
            {g.moves.map((t) => <button key={t} aria-pressed={last === t} onClick={() => tap(t)}>{t}</button>)}
          </div>
        </section>
      ))}
      <button className="btn" onClick={() => { ref.current?.finishNow(); ref.current?.setState(start); setLast(null); }}>↺ Rapikan kubus</button>
    </main>
  );
}
