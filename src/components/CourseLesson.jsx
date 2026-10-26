import { useMemo, useState } from 'react';
import CubeView from '../three/CubeView.jsx';
import { TopBar } from './common.jsx';
import CaseCard, { LazyMount } from './CaseCard.jsx';
import Quiz from './Quiz.jsx';
import Player from './Player.jsx';
import IntroLesson from './IntroLesson.jsx';
import { COURSE, QUIZ_KEYS } from '../content/course.js';
import { buildState } from '../learn/build.js';
import { makeStageDemo } from '../learn/quiz.js';

export default function CourseLesson({ index, done, onToggleDone, onBack, onGo }) {
  const L = COURSE[index];
  const next = COURSE[index + 1];
  const [quiz, setQuiz] = useState(false);
  const [demo, setDemo] = useState(null);
  const [demoPos, setDemoPos] = useState(0);
  const [loading, setLoading] = useState(false);
  const goal = useMemo(() => (L.goal ? buildState(L.goal) : null), [L]);

  const openDemo = () => {
    setLoading(true);
    setTimeout(() => { setDemo(makeStageDemo(L.key)); setDemoPos(0); setLoading(false); }, 30);
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
        <TopBar title="Mulai di sini" sub="Kursus Pemula 3x3" onBack={onBack} />
        <IntroLesson />
        {footer}
      </main>
    );
  }

  return (
    <main className="screen full">
      <TopBar title={`Tahap ${index}: ${L.title}`} sub={`Kursus Pemula 3x3 · ${index} dari ${COURSE.length - 1}`} onBack={onBack} />
      <section className="lesson-goal">
        <LazyMount height={220} className="goal-cube">
          <CubeView N={3} state={goal} view={L.goal.view || 'front'} zoom={1.25} />
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

      <section className="lesson-sec">
        <h3>Kalau kamu lihat ini, lakukan ini</h3>
        <p className="muted small">Pegang kuning di atas dan hijau menghadapmu. Keping abu-abu belum penting di tahap ini.</p>
        <div className="case-list">
          {L.cases.map((c, i) => <CaseCard key={L.id + i} c={c} num={String.fromCharCode(65 + i)} />)}
        </div>
      </section>

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
        {QUIZ_KEYS.includes(L.key) && (quiz
          ? <Quiz stageKey={L.key} onClose={() => setQuiz(false)} />
          : <button className="row-item" onClick={() => setQuiz(true)}>
              <span className="badge-sq" style={{ background: 'var(--sun)' }}>🧠</span>
              <span className="body"><b>Kuis: kalau begini, apa langkahmu?</b><span>5 soal dari kubus acak sungguhan. Tebak dulu, lalu lihat caranya.</span></span>
            </button>)}
        <button className="row-item" onClick={openDemo} disabled={loading}>
          <span className="badge-sq" style={{ background: 'var(--blue)', color: '#fff' }}>▶</span>
          <span className="body"><b>{loading ? 'Menyiapkan contoh…' : 'Tonton contoh dari kubus acak'}</b><span>Kubus diacak, lalu hanya tahap ini yang dikerjakan langkah demi langkah.</span></span>
        </button>
      </section>
      {footer}
    </main>
  );
}
