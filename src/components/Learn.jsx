import { useState } from 'react';
import { SizePicker } from './common.jsx';
import { METHODS } from '../core/solver/index.js';
import { lessonFor } from '../content/lessons.js';
import { load, save } from '../storage.js';

const SIZE_NOTE = {
  2: 'Kubus 2x2 hanya punya 8 sudut — cara tercepat untuk mulai.',
  3: 'Kubus klasik. Kuasai metode pemula dulu, lalu naik ke CFOP.',
  4: 'Tidak ada center tetap & ada parity. Butuh ilmu 3x3.',
  5: 'Mirip 4x4 tapi tanpa OLL/PLL parity.',
};

export default function Learn({ onOpen, onMethods }) {
  const [N, setN] = useState(() => load('learnN', 3));
  const pick = (n) => { setN(n); save('learnN', n); };
  return (
    <main className="screen">
      <div>
        <h1>Belajar</h1>
        <p className="muted" style={{ marginTop: 6 }}>Pilih ukuran, lalu pilih metode. Setiap rumus bisa kamu tonton animasinya.</p>
      </div>
      <SizePicker N={N} setN={pick} />
      <p className="muted small">{SIZE_NOTE[N]}</p>
      <div className="list">
        {METHODS[N].map((m, i) => {
          const l = lessonFor(N, m.id);
          return (
            <button key={m.id} className="row-item" onClick={() => onOpen(N, m.id)}>
              <span className="badge-sq" style={{ background: ['#ffd23f', '#1fb86a', '#2f6bff'][i] || '#edf2fc', color: i === 0 ? '#1b2a4a' : '#fff' }}>{i + 1}</span>
              <span className="body"><b>{m.name}<span className={'level ' + m.level}>{m.level}</span></b><span>{l.intro}</span></span>
            </button>
          );
        })}
      </div>
      <button className="row-item" onClick={onMethods}>
        <span className="badge-sq" style={{ background: '#1b2a4a', color: '#ffd23f' }}>📚</span>
        <span className="body"><b>Semua metode</b><span>Pemula, CFOP, Roux, ZZ, Petrus, Ortega, CLL/EG, Reduksi, Yau, Hoya — kelebihan & kapan mempelajarinya.</span></span>
      </button>
    </main>
  );
}
