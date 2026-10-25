import { useState } from 'react';
import { TopBar } from './common.jsx';
import { lessonFor } from '../content/lessons.js';
import AlgSheet from './AlgSheet.jsx';

export default function Lesson({ N, method, onBack }) {
  const lesson = lessonFor(N, method);
  const [sheet, setSheet] = useState(null);
  return (
    <main className="screen full">
      <TopBar title={lesson.title} sub={`Kubus ${N}x${N}`} onBack={onBack} />
      <p className="muted">{lesson.intro}</p>
      {lesson.stages.map((st, si) => (
        <section key={si} className="stage-block">
          <div className="stage-title"><span className="num">{si + 1}</span><h3>{st.title}</h3></div>
          <p>{st.text}</p>
          {st.tips && st.tips.length > 0 && <div className="tips-box"><ul>{st.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
          {st.algs.length > 0 && (
            <div className="list">
              {st.algs.map((a, i) => (
                <div key={i} className="alg-card">
                  <div className="info">
                    <b>{a.name}</b>
                    <span className="alg-text">{a.alg}</span>
                    {a.note && <span className="muted small">{a.note}</span>}
                    <button className="btn small" style={{ alignSelf: 'flex-start' }} onClick={() => setSheet({ ...a, n: a.n || N })}>🎬 Lihat animasi</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      {sheet && <AlgSheet N={sheet.n} alg={sheet.alg} title={sheet.name} note={sheet.note} onClose={() => setSheet(null)} />}
    </main>
  );
}
