import { useMemo, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { TopBar, COLOR_LABEL } from './common.jsx';

const FACE_TITLE = ['Atas', 'Kanan', 'Depan', 'Bawah', 'Kiri', 'Belakang'];
const FACE_HINT = [
  'Bagian atas gambar menempel ke sisi belakang, bagian bawah ke sisi depan.',
  'Bagian kiri gambar menempel ke sisi depan.',
  'Seperti saat kamu melihatnya langsung.',
  'Bagian atas gambar menempel ke sisi depan.',
  'Bagian kanan gambar menempel ke sisi depan.',
  'Bagian kiri gambar menempel ke sisi kanan.',
];
const NET = [[null, 0, null, null], [4, 2, 1, 5], [null, 3, null, null]];

export default function Editor({ N, draft, from, onChange, onBack, onRescan, onNext }) {
  const n2 = N * N;
  const [face, setFace] = useState(2);
  const [paint, setPaint] = useState(0);
  const counts = useMemo(() => { const c = new Array(7).fill(0); draft.forEach((x) => { c[x]++; }); return c; }, [draft]);
  const empty = counts[6];

  const setCell = (i) => {
    const next = draft.slice();
    next[face * n2 + i] = paint;
    onChange(next);
  };

  return (
    <main className="screen full">
      <TopBar title={from === 'scan' ? 'Cek warna' : 'Isi warna'} sub={from === 'scan' ? 'Ketuk stiker yang salah untuk memperbaiki' : 'Pilih warna, lalu ketuk stiker'} onBack={onBack} />
      <div className="stage-cube" style={{ height: 200 }}>
        <CubeView N={N} state={draft} labels />
      </div>
      <div className="net" role="group" aria-label="Pilih sisi">
        {NET.flat().map((f, k) => (f === null ? <div key={k} className="slot-empty" /> : (
          <div key={k}>
            <button className="face" aria-pressed={face === f} aria-label={`Sisi ${FACE_TITLE[f]}`} onClick={() => setFace(f)} style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
              {draft.slice(f * n2, (f + 1) * n2).map((c, i) => <i key={i} style={{ background: STICKER_HEX[c] }} />)}
            </button>
            <div className="face-label">{FACE_TITLE[f]}</div>
          </div>
        )))}
      </div>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <h3>Sisi {FACE_TITLE[face].toLowerCase()}</h3>
          <p className="muted small">{FACE_HINT[face]}</p>
        </div>
        <div className="big-face" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {draft.slice(face * n2, (face + 1) * n2).map((c, i) => (
            <button key={i} aria-label={`Stiker ${i + 1}: ${c < 6 ? COLOR_LABEL[c] : 'kosong'}`} style={{ background: STICKER_HEX[c] }} onClick={() => setCell(i)} />
          ))}
        </div>
        <div className="palette" role="group" aria-label="Warna kuas">
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <button key={c} aria-pressed={paint === c} aria-label={`${COLOR_LABEL[c]} (${counts[c]} dari ${n2})`} style={{ background: STICKER_HEX[c] }} onClick={() => setPaint(c)}>
              <span className={'count' + (counts[c] === n2 ? ' ok' : counts[c] > n2 ? ' over' : '')}>{counts[c]}</span>
            </button>
          ))}
        </div>
        <p className="muted small">Setiap warna harus tepat {n2} stiker. {empty ? `Masih ada ${empty} stiker kosong.` : 'Semua stiker sudah terisi.'}</p>
      </div>
      <div className="action-row">
        {from === 'scan' ? <button className="btn" onClick={onRescan}>Scan ulang</button> : <button className="btn" onClick={onBack}>Batal</button>}
        <button className="btn primary" disabled={empty > 0} onClick={onNext}>Lanjut</button>
      </div>
    </main>
  );
}
