import { useMemo, useRef, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { LazyMount } from './CaseCard.jsx';
import { groupN, baseN } from '../learn/build.js';
import { randomCube4 } from '../learn/quiz4.js';
import { describeMove } from '../core/notation.js';
import { COURSE4 } from '../content/course4.js';

const EDGES = ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BR', 'BL', 'DF', 'DR', 'DB', 'DL'];

const KINDS = [
  { id: 'center', label: 'Center', note: 'Keping tengah: 4 per sisi, total 24. Berbeda dengan 3x3, center 4x4 BISA berpindah — jadi harus dikumpulkan dulu.' },
  { id: 'edge', label: 'Edge', note: 'Keping pinggir: 2 per pinggir, total 24. Dua keping dengan warna sama harus dipasangkan menjadi satu edge.' },
  { id: 'corner', label: 'Sudut', note: 'Keping sudut: 8, sama persis seperti di 3x3.' },
  { id: 'step1', label: '1 · Center putih', note: 'Langkah pertama dari kubus acak: cari keping center PUTIH yang menyala, lalu kumpulkan di satu sisi.' },
  { id: 'step2', label: '2 · Sepasang edge', note: 'Nanti, setelah semua center jadi: cari dua keping edge dengan warna sama (yang menyala) dan satukan.' },
];

function Explorer4() {
  const [cube, setCube] = useState(() => randomCube4());
  const [kind, setKind] = useState('step1');
  const focus = useMemo(() => {
    if (kind === 'center') return groupN(4, 'centers');
    if (kind === 'edge') return groupN(4, 'wings');
    if (kind === 'corner') return groupN(4, 'corners');
    if (kind === 'step1') return groupN(4, 'centers').filter((i) => cube[i] === 0);
    // sepasang edge putih-hijau di kubus acak ini
    const wings = EDGES.flatMap((e) => ['+', '-'].map((sg) => groupN(4, `wing:${e}:${sg}`)));
    return wings.filter((w) => { const c = w.map((i) => cube[i]).sort().join(); return c === '0,4'; }).flat();
  }, [kind, cube]);
  const info = KINDS.find((k) => k.id === kind);
  return (
    <div className="explorer">
      <LazyMount height={260} className="goal-cube">
        <CubeView N={4} state={cube} focus={focus} labels dim={0.6} zoom={1.15} />
      </LazyMount>
      <div className="explorer-groups">
        <div>
          <span className="case-part-label">Jenis keping</span>
          <div className="seg" role="group" aria-label="Jenis keping">
            {KINDS.slice(0, 3).map((k) => <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>)}
          </div>
        </div>
        <div>
          <span className="case-part-label">Yang dicari dari kubus acak</span>
          <div className="seg" role="group" aria-label="Yang dicari">
            {KINDS.slice(3).map((k) => <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</button>)}
          </div>
        </div>
      </div>
      <p className="explorer-note">{info.note}</p>
      <button className="btn small" onClick={() => setCube(randomCube4())}>🎲 Acak kubus lain</button>
    </div>
  );
}

const DEMO = ['R', '2R', 'Rw', "R'", 'U', '2U', 'Uw', 'F', '2D', 'z2'];

function MoveDemo4() {
  const ref = useRef(null);
  const [last, setLast] = useState(null);
  const start = useMemo(() => baseN(4, 'Y').slice(), []);
  return (
    <div className="explorer">
      <LazyMount height={230} className="goal-cube">
        <CubeView ref={ref} N={4} state={start} labels zoom={1.1} />
      </LazyMount>
      <div className="note-grid">
        {DEMO.map((t) => <button key={t} aria-pressed={last === t} onClick={() => { setLast(t); ref.current?.move(t, 750); }}>{t}</button>)}
      </div>
      <div className="move-meaning">{last ? <><b>{last}</b><span>{describeMove(last, 4).text}</span></> : <span>Bandingkan R, 2R, dan Rw: luar saja, dalam saja, atau dua lapis sekaligus.</span>}</div>
      <button className="btn small" onClick={() => { ref.current?.finishNow(); ref.current?.setState(start); setLast(null); }}>↺ Rapikan</button>
    </div>
  );
}

const SCHEME = [[1, 'Kuning (atas)'], [4, 'Hijau (depan)'], [3, 'Oranye (kanan)'], [5, 'Biru (belakang)'], [2, 'Merah (kiri)'], [0, 'Putih (bawah)']];

export default function Intro4() {
  return (
    <>
      <section className="lesson-sec">
        <h3>Bedanya 4x4 dengan 3x3</h3>
        <ul className="mistakes">
          <li>Tidak ada center yang diam. Keping center bisa pindah, jadi warna tiap sisi ditentukan olehmu.</li>
          <li>Edge terdiri dari 2 keping yang harus dipasangkan dulu.</li>
          <li>Ada lapisan DALAM yang bisa diputar (2R, 2U, …).</li>
          <li>Kadang muncul "parity": kasus yang mustahil di 3x3. Ada rumusnya.</li>
        </ul>
      </section>

      <section className="lesson-sec">
        <h3>Kenali kepingnya di kubus acak</h3>
        <p className="muted">Ketuk tombol untuk menyalakan jenis keping. Mulailah dengan mencari keping center putih.</p>
        <Explorer4 />
      </section>

      <section className="lesson-sec">
        <h3>Cara membaca gerakan 4x4</h3>
        <ul className="mistakes">
          <li><b>R</b> = hanya lapisan kanan paling luar (sama seperti 3x3).</li>
          <li><b>2R</b> = hanya lapisan kedua dari kanan (lapisan dalam).</li>
          <li><b>Rw</b> = dua lapisan kanan sekaligus (luar + dalam).</li>
          <li><b>z2</b> = seluruh kubus diputar 180° seperti setir.</li>
        </ul>
        <MoveDemo4 />
      </section>

      <section className="lesson-sec">
        <h3>Urutan warna yang harus dihafal</h3>
        <div className="scheme-row">
          {SCHEME.map(([c, label]) => <div key={c} className="pair"><i style={{ background: STICKER_HEX[c] }} /><span>{label}</span></div>)}
        </div>
        <p className="muted small">Karena center 4x4 tidak punya tempat tetap, kamu harus menyusunnya dengan urutan ini. Pasangan berseberangan: putih–kuning, merah–oranye, hijau–biru.</p>
      </section>

      <section className="lesson-sec">
        <h3>Rencana besarnya: kubus acak → selesai</h3>
        <ol className="route">
          {COURSE4.filter((l) => !l.intro).map((l) => <li key={l.id}><b>{l.title}</b><span>{l.short}</span></li>)}
        </ol>
      </section>
    </>
  );
}
