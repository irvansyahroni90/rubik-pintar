import { useState } from 'react';
import { SizePicker } from './common.jsx';
import { METHODS } from '../core/solver/index.js';
import { lessonFor } from '../content/lessons.js';
import { COURSE } from '../content/course.js';
import { load, save } from '../storage.js';

const SIZE_NOTE = {
  2: 'Kubus 2x2 hanya punya 8 sudut. Tahap sudutnya sama dengan Kursus Pemula 3x3 (tahap 3, 7, dan 8).',
  3: 'Kuasai Kursus Pemula dulu, lalu naik ke CFOP.',
  4: 'Tidak ada center tetap & ada parity. Butuh ilmu 3x3.',
  5: 'Mirip 4x4 tapi tanpa OLL/PLL parity.',
};

export default function Learn({ progress, onCourse, onOpen, onMethods }) {
  const [N, setN] = useState(() => load('learnN', 3));
  const pick = (n) => { setN(n); save('learnN', n); };
  const doneCount = COURSE.filter((l) => progress[l.id]).length;
  const nextIdx = Math.max(0, COURSE.findIndex((l) => !progress[l.id]));
  return (
    <main className="screen">
      <div>
        <h1>Belajar</h1>
        <p className="muted" style={{ marginTop: 6 }}>Mulai dari nol sampai bisa menyelesaikan kubus 3x3 sendiri.</p>
      </div>

      <section className="course-card">
        <div className="course-top">
          <div>
            <h2>Kursus Pemula 3x3</h2>
            <p className="small">Setiap tahap: tujuan, langkah awal dari kubus acak, kasus "kalau begini → lakukan ini" dengan animasi, kuis, dan contoh.</p>
          </div>
        </div>
        <div className="progress" aria-label={`${doneCount} dari ${COURSE.length} pelajaran selesai`}><i style={{ width: `${(doneCount / COURSE.length) * 100}%` }} /></div>
        <button className="btn primary block" onClick={() => onCourse(nextIdx === -1 ? 0 : nextIdx)}>
          {doneCount === 0 ? 'Mulai belajar' : doneCount === COURSE.length ? 'Ulangi dari awal' : `Lanjutkan: ${COURSE[nextIdx].intro ? 'Mulai di sini' : 'Tahap ' + nextIdx + ' · ' + COURSE[nextIdx].title}`}
        </button>
        <ol className="course-list">
          {COURSE.map((l, i) => (
            <li key={l.id}>
              <button className={'course-row' + (progress[l.id] ? ' done' : '')} onClick={() => onCourse(i)}>
                <span className="course-num" aria-hidden="true">{progress[l.id] ? '✓' : l.intro ? '★' : i}</span>
                <span className="body"><b>{l.intro ? 'Mulai di sini: ' + l.title : l.title}</b><span>{l.short}</span></span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="list">
        <h3>Ukuran & metode lain</h3>
        <SizePicker N={N} setN={pick} />
        <p className="muted small">{SIZE_NOTE[N]}</p>
        {METHODS[N].map((m, i) => {
          const l = lessonFor(N, m.id);
          return (
            <button key={m.id} className="row-item" onClick={() => onOpen(N, m.id)}>
              <span className="badge-sq" style={{ background: ['#ffd23f', '#1fb86a', '#2f6bff'][i] || '#edf2fc', color: i === 0 ? '#1b2a4a' : '#fff' }}>{i + 1}</span>
              <span className="body"><b>{m.name}<span className={'level ' + m.level}>{m.level}</span></b><span>{l.intro}</span></span>
            </button>
          );
        })}
        <button className="row-item" onClick={onMethods}>
          <span className="badge-sq" style={{ background: '#1b2a4a', color: '#ffd23f' }}>📚</span>
          <span className="body"><b>Semua metode</b><span>Pemula, CFOP, Roux, ZZ, Petrus, Ortega, CLL/EG, Reduksi, Yau, Hoya — kelebihan & kapan mempelajarinya.</span></span>
        </button>
      </section>
    </main>
  );
}
