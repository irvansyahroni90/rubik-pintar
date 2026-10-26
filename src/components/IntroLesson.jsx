import { useMemo, useRef, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { LazyMount } from './CaseCard.jsx';
import { BASE, stickersAt } from '../learn/build.js';
import { randomCubeYellowTop } from '../learn/quiz.js';
import { describeMove } from '../core/notation.js';
import { st, CORNERS, EDGES } from '../core/pieces.js';
import { COURSE } from '../content/course.js';

const KINDS = [
  { id: 'center', label: 'Center', note: 'Keping tengah, 1 warna, ada 6. Tidak pernah berpindah tempat — dialah yang menentukan warna tiap sisi.' },
  { id: 'edge', label: 'Edge', note: 'Keping pinggir, 2 warna, ada 12. Selalu berada di antara dua center.' },
  { id: 'corner', label: 'Sudut', note: 'Keping sudut, 3 warna, ada 8.' },
  { id: 'step1', label: 'Langkah 1', note: 'Cari tengah KUNING dan pegang di atas. Tengah hijau menghadapmu. Pegangan ini dipakai di semua tahap.' },
  { id: 'step2', label: 'Langkah 2', note: 'Cari 4 edge yang punya warna PUTIH. Inilah target pertamamu: dijadikan "bunga" di sekitar tengah kuning.' },
];

function PieceExplorer() {
  const [cube, setCube] = useState(() => randomCubeYellowTop());
  const [kind, setKind] = useState('step2');
  const focus = useMemo(() => {
    if (kind === 'center') return ['U', 'D', 'F', 'B', 'R', 'L'].map((f) => st(3, f, f));
    if (kind === 'edge') return stickersAt(EDGES);
    if (kind === 'corner') return stickersAt(CORNERS);
    if (kind === 'step1') return [st(3, 'U', 'U')];
    // edge putih: cari edge yang punya stiker putih di kubus acak ini
    return EDGES.filter((e) => e.split('').some((f) => cube[st(3, e, f)] === 0)).flatMap((e) => e.split('').map((f) => st(3, e, f)));
  }, [kind, cube]);
  const info = KINDS.find((k) => k.id === kind);
  return (
    <div className="explorer">
      <LazyMount height={250} className="goal-cube">
        <CubeView N={3} state={cube} focus={focus} labels dim={0.6} zoom={1.15} />
      </LazyMount>
      <div className="explorer-groups">
        <div>
          <span className="case-part-label">Jenis keping</span>
          <div className="seg" role="group" aria-label="Jenis keping">
            {KINDS.slice(0, 3).map((k) => <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>)}
          </div>
        </div>
        <div>
          <span className="case-part-label">Langkah pertama dari kubus acak</span>
          <div className="seg" role="group" aria-label="Langkah pertama">
            {KINDS.slice(3).map((k) => <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.id === 'step1' ? '1 · Tengah kuning' : '2 · Edge putih'}</button>)}
          </div>
        </div>
      </div>
      <p className="explorer-note">{info.note}</p>
      <button className="btn small" onClick={() => setCube(randomCubeYellowTop())}>🎲 Acak kubus lain</button>
    </div>
  );
}

const DEMO_MOVES = ['R', "R'", 'U', "U'", 'F', "F'", 'L', 'D'];

function MoveDemo() {
  const ref = useRef(null);
  const [last, setLast] = useState(null);
  const start = useMemo(() => BASE.slice(), []);
  return (
    <div className="explorer">
      <LazyMount height={220} className="goal-cube">
        <CubeView ref={ref} N={3} state={start} labels />
      </LazyMount>
      <div className="note-grid">
        {DEMO_MOVES.map((t) => <button key={t} aria-pressed={last === t} onClick={() => { setLast(t); ref.current?.move(t, 650); }}>{t}</button>)}
      </div>
      <div className="move-meaning">{last ? <><b>{last}</b><span>{describeMove(last, 3).text}</span></> : <span>Ketuk huruf untuk melihat gerakannya.</span>}</div>
      <button className="btn small" onClick={() => { ref.current?.finishNow(); ref.current?.setState(start); setLast(null); }}>↺ Rapikan</button>
    </div>
  );
}

const PAIRS = [[0, 1], [2, 3], [4, 5]];
const PAIR_NAME = ['Putih ↔ Kuning', 'Merah ↔ Oranye', 'Hijau ↔ Biru'];

export default function IntroLesson() {
  return (
    <>
      <section className="lesson-sec">
        <h3>Kubusmu terdiri dari 3 jenis keping</h3>
        <p className="muted">Ini kubus acak. Ketuk tombol untuk menyalakan jenis keping tertentu. Jangan menghafal stiker — pikirkan kepingnya.</p>
        <PieceExplorer />
      </section>

      <section className="lesson-sec">
        <h3>Warna yang selalu berseberangan</h3>
        <div className="pairs">
          {PAIRS.map((p, i) => (
            <div key={i} className="pair">
              <i style={{ background: STICKER_HEX[p[0]] }} /><i style={{ background: STICKER_HEX[p[1]] }} />
              <span>{PAIR_NAME[i]}</span>
            </div>
          ))}
        </div>
        <p className="muted small">Karena center tidak pernah pindah, pasangan ini tidak pernah berubah. Kalau kuning di atas, putih pasti di bawah.</p>
      </section>

      <section className="lesson-sec">
        <h3>Cara membaca gerakan</h3>
        <ul className="mistakes">
          <li>Huruf = sisi yang diputar: <b>R</b> kanan, <b>L</b> kiri, <b>U</b> atas, <b>D</b> bawah, <b>F</b> depan.</li>
          <li>Tanpa tanda = searah jarum jam bila kamu menatap sisi itu langsung. Tanda <b>'</b> = kebalikannya. Angka <b>2</b> = dua kali.</li>
          <li>Paling sering dipakai: <b>R</b> (kanan ke atas), <b>R'</b> (kanan ke bawah), <b>U</b> (atas ke kiri), <b>U'</b> (atas ke kanan).</li>
        </ul>
        <MoveDemo />
      </section>

      <section className="lesson-sec">
        <h3>Kubus acak di tanganmu? Ini urutannya</h3>
        <p className="muted small">Metode pemula menyelesaikan kubus lapis demi lapis, dari bawah ke atas, dalam 8 tahap. Kerjakan berurutan.</p>
        <ol className="route">
          {COURSE.filter((l) => !l.intro).map((l) => <li key={l.id}><b>{l.title}</b><span>{l.short}</span></li>)}
        </ol>
      </section>
    </>
  );
}
