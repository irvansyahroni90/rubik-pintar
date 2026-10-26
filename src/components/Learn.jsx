import { useState } from 'react';
import { SizePicker } from './common.jsx';
import { METHODS } from '../core/solver/index.js';
import { lessonFor } from '../content/lessons.js';
import { COURSES, COURSE_ORDER, progressKey } from '../content/courses.js';
import { load, save } from '../storage.js';

const SIZE_NOTE = {
  2: 'Kubus 2x2 hanya punya 8 sudut. Tahap sudutnya sama dengan Kursus Pemula 3x3 (tahap 3, 7, dan 8).',
  3: 'Kuasai Kursus Pemula dulu, lalu naik ke CFOP.',
  4: 'Materi ringkas metode reduksi. Untuk belajar dari nol, pakai Kursus 4x4 di atas.',
  5: 'Mirip 4x4 tapi tanpa OLL/PLL parity.',
};

function CourseCard({ course, progress, open, onToggle, onCourse }) {
  const lessons = course.lessons;
  const isDone = (l) => !!progress[progressKey(course.id, l.id)];
  const doneCount = lessons.filter(isDone).length;
  const nextIdx = lessons.findIndex((l) => !isDone(l));
  const label = doneCount === 0 ? 'Mulai belajar' : nextIdx === -1 ? 'Ulangi dari awal' : `Lanjutkan: ${lessons[nextIdx].intro ? 'Mulai di sini' : 'Tahap ' + nextIdx + ' · ' + lessons[nextIdx].title}`;
  return (
    <section className="course-card">
      <div className="course-top">
        <span className="course-size" aria-hidden="true">{course.N}x{course.N}</span>
        <div>
          <h2>{course.title}</h2>
          <p className="small">{course.blurb}</p>
        </div>
      </div>
      <div className="progress" aria-label={`${doneCount} dari ${lessons.length} pelajaran selesai`}><i style={{ width: `${(doneCount / lessons.length) * 100}%` }} /></div>
      <button className="btn primary block" onClick={() => onCourse(course.id, nextIdx === -1 ? 0 : nextIdx)}>{label}</button>
      <button className="course-toggle" onClick={onToggle} aria-expanded={open}>{open ? 'Sembunyikan daftar pelajaran ▴' : `Lihat ${lessons.length} pelajaran ▾`}</button>
      {open && (
        <ol className="course-list">
          {lessons.map((l, i) => (
            <li key={l.id}>
              <button className={'course-row' + (isDone(l) ? ' done' : '')} onClick={() => onCourse(course.id, i)}>
                <span className="course-num" aria-hidden="true">{isDone(l) ? '✓' : l.intro ? '★' : i}</span>
                <span className="body"><b>{l.intro ? 'Mulai di sini: ' + l.title : l.title}</b><span>{l.short}</span></span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function Learn({ progress, onCourse, onOpen, onMethods }) {
  const [N, setN] = useState(() => load('learnN', 4));
  const [open, setOpen] = useState(() => load('courseOpen', { '4x4': true, '3x3': false }));
  const pick = (n) => { setN(n); save('learnN', n); };
  const toggle = (id) => { const o = { ...open, [id]: !open[id] }; setOpen(o); save('courseOpen', o); };
  return (
    <main className="screen">
      <div>
        <h1>Belajar</h1>
        <p className="muted" style={{ marginTop: 6 }}>Kursus langkah demi langkah, dari kubus acak sampai selesai.</p>
      </div>

      {COURSE_ORDER.map((id) => (
        <CourseCard key={id} course={COURSES[id]} progress={progress} open={!!open[id]} onToggle={() => toggle(id)} onCourse={onCourse} />
      ))}

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
