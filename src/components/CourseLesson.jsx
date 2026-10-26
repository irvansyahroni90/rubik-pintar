import { useMemo, useState } from 'react';
import CubeView from '../three/CubeView.jsx';
import { TopBar } from './common.jsx';
import CaseCard, { LazyMount } from './CaseCard.jsx';
import Quiz from './Quiz.jsx';
import Player from './Player.jsx';
import IntroLesson from './IntroLesson.jsx';
import Intro4 from './Intro4.jsx';
import { COURSES } from '../content/courses.js';
import { COURSE as COURSE3 } from '../content/course.js';
import { buildState } from '../learn/build.js';
import { makeStageDemo, makeQuestion } from '../learn/quiz.js';
import { makeStageDemo4, makeQuestion4 } from '../learn/quiz4.js';

export default function CourseLesson({ courseId, index, done, onToggleDone, onBack, onGo, onOpenCourse }) {
  const course = COURSES[courseId];
  const N = course.N;
  const lessons = course.lessons;
  const L = lessons[index];
  const next = lessons[index + 1];
  const [quiz, setQuiz] = useState(false);
  const [demo, setDemo] = useState(null);
  const [demoPos, setDemoPos] = useState(0);
  const [loading, setLoading] = useState(false);
  const goal = useMemo(() => (L.goal ? buildState({ N, ...L.goal }) : null), [L, N]);
  const makeDemo = N === 4 ? makeStageDemo4 : makeStageDemo;
  const makeQ = N === 4 ? makeQuestion4 : makeQuestion;

  const openDemo = () => {
    setLoading(true);
    setTimeout(() => { setDemo(makeDemo(L.key)); setDemoPos(0); setLoading(false); }, 30);
  };

  if (demo) {
    return <Player key={demo.start.join('')} result={demo} pos={demoPos} onPos={setDemoPos} onExit={() => setDemo(null)} onNew={openDemo} />;
  }

  const footer = (
    <div className="lesson-footer">
      <button className={'btn block' + (done ? ' done-btn' : '')} onClick={onToggleDone} aria-pressed={done}>{done ? '✓ Sudah paham' : 'Tandai sudah paham'}</button>
      {next && <button className="btn primary block" onClick={() => onGo(index + 1)}>Lanjut ke tahap {index + 1}: {next.title}</button>}
      {!next && <button className="btn primary block" onClick={onBack}>Selesai — kembali ke daftar</button>}
    </div>
  );

  if (L.intro) {
    return (
      <main className="screen full">
        <TopBar title="Mulai di sini" sub={course.title} onBack={onBack} />
        {N === 4 ? <Intro4 /> : <IntroLesson />}
        {footer}
      </main>
    );
  }

  return (
    <main className="screen full">
      <TopBar title={`Tahap ${index}: ${L.title}`} sub={`${course.title} · ${index} dari ${lessons.length - 1}`} onBack={onBack} />
      <section className="lesson-goal">
        <LazyMount height={220} className="goal-cube">
          <CubeView N={N} state={goal} view={L.goal.view || 'front'} zoom={1.25} />
        </LazyMount>
        <div>
          <h3>🎯 Tujuan</h3>
          <p>{L.goal.text}</p>
        </div>
      </section>

      <section className="lesson-sec">
        <h3>Mulai dari kubus acak</h3>
        <ol className="first-steps">{L.firstSteps.map((t, i) => <li key={i}>{t}</li>)}</ol>
      </section>

      {L.link3 && (
        <section className="lesson-sec">
          <h3>8 tahap 3x3 yang dipakai</h3>
          <p className="muted small">Ketuk untuk membuka pelajarannya. Semua kasus & kuisnya berlaku juga untuk 4x4 yang sudah tereduksi.</p>
          <div className="list">
            {COURSE3.filter((l) => !l.intro).map((l, i) => (
              <button key={l.id} className="row-item" onClick={() => onOpenCourse('3x3', i + 1)}>
                <span className="badge-sq" style={{ background: 'var(--ink)', color: 'var(--sun)' }}>{i + 1}</span>
                <span className="body"><b>{l.title}</b><span>{l.short}</span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {L.cases.length > 0 && (
        <section className="lesson-sec">
          <h3>Kalau kamu lihat ini, lakukan ini</h3>
          <p className="muted small">{L.hold || 'Pegang kuning di atas dan hijau menghadapmu.'} Keping abu-abu belum penting di tahap ini.</p>
          <div className="case-list">
            {L.cases.map((c, i) => <CaseCard key={L.id + i} c={c} num={String.fromCharCode(65 + i)} />)}
          </div>
        </section>
      )}

      {L.algs.length > 0 && (
        <section className="lesson-sec">
          <h3>Rumus tahap ini</h3>
          <div className="alg-list">{L.algs.map((a) => <div key={a.name} className="alg-row"><span>{a.name}</span><b className="alg-text">{a.alg}</b></div>)}</div>
        </section>
      )}

      <section className="lesson-sec">
        <h3>Hati-hati</h3>
        <ul className="mistakes">{L.mistakes.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </section>

      <section className="lesson-sec">
        <h3>Latihan</h3>
        {course.quizKeys.includes(L.key) && (quiz
          ? <Quiz stageKey={L.key} make={makeQ} onClose={() => setQuiz(false)} />
          : <button className="row-item" onClick={() => setQuiz(true)}>
              <span className="badge-sq" style={{ background: 'var(--sun)' }}>🧠</span>
              <span className="body"><b>Kuis: kalau begini, apa langkahmu?</b><span>5 soal{N === 4 && L.key === 'centers4' ? ' tentang urutan warna center.' : ' dari kubus acak sungguhan. Tebak dulu, lalu lihat caranya.'}</span></span>
            </button>)}
        {L.key && (
          <button className="row-item" onClick={openDemo} disabled={loading}>
            <span className="badge-sq" style={{ background: 'var(--blue)', color: '#fff' }}>▶</span>
            <span className="body"><b>{loading ? 'Menyiapkan contoh…' : 'Tonton contoh dari kubus acak'}</b><span>Kubus {N}x{N} diacak, lalu tahap ini dikerjakan langkah demi langkah.</span></span>
          </button>
        )}
      </section>
      {footer}
    </main>
  );
}
