import { useEffect, useRef, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { makeQuestion } from '../learn/quiz.js';
import { trackFocus } from './CaseCard.jsx';

const ROUND = 5;

export default function Quiz({ stageKey, onClose }) {
  const [q, setQ] = useState(null);
  const [pick, setPick] = useState(undefined);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const [played, setPlayed] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const alive = useRef(true);
  const qid = useRef(0);

  const next = () => {
    qid.current++;
    setBusy(true);
    setTimeout(() => {
      const nq = makeQuestion(stageKey);
      setQ(nq); setPick(undefined); setPlayed(false); setBusy(false);
      if (nq && ref.current) { ref.current.finishNow(); ref.current.setState(nq.state); ref.current.setFocus(nq.focus); }
    }, 30);
  };
  useEffect(() => { alive.current = true; next(); return () => { alive.current = false; }; }, [stageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = pick !== undefined;
  const correct = answered && pick === q.answer;
  const finished = score.n >= ROUND && answered;

  const choose = (opt) => {
    if (answered) return;
    setPick(opt.id);
    setScore((s) => ({ ok: s.ok + (opt.id === q.answer ? 1 : 0), n: s.n + 1 }));
  };
  const show = async () => {
    if (!q || played) return;
    setPlayed(true);
    const my = qid.current;
    for (let k = 0; k < q.moves.length && alive.current && my === qid.current; k++) {
      await ref.current?.move(q.moves[k], 480, trackFocus(q.focus, q.moves.slice(0, k + 1)));
    }
  };
  const restart = () => { setScore({ ok: 0, n: 0 }); next(); };

  return (
    <section className="quiz" aria-label="Kuis">
      <div className="quiz-head">
        <b>Kuis · soal {Math.min(score.n + (answered ? 0 : 1), ROUND)} dari {ROUND}</b>
        <span>Benar {score.ok}</span>
        {onClose && <button className="btn small ghost" onClick={onClose} aria-label="Tutup kuis">✕</button>}
      </div>
      <div className="quiz-cube">
        {q ? <CubeView ref={ref} N={3} state={q.state} focus={q.focus} dim={0.45} zoom={1.25} /> : <div className="quiz-wait">{busy ? 'Mengacak kubus…' : 'Soal tidak tersedia'}</div>}
      </div>
      {q && (
        <>
          <p className="quiz-prompt">{q.prompt}</p>
          <div className="quiz-options">
            {q.options.map((o) => {
              const state = !answered ? '' : o.id === q.answer ? ' right' : o.id === pick ? ' wrong' : ' dim';
              return (
                <button key={String(o.id)} className={'btn quiz-opt' + state} onClick={() => choose(o)} disabled={answered && o.id !== q.answer && o.id !== pick}>
                  {o.color !== undefined && <i className="chip" style={{ background: STICKER_HEX[o.color] }} />}
                  {o.label}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className={'quiz-feedback' + (correct ? ' ok' : '')} role="status">
              <b>{correct ? 'Tepat!' : 'Belum tepat.'}</b> {q.explain}
            </div>
          )}
          {answered && (
            <div className="action-row">
              <button className="btn" onClick={show} disabled={played}>{played ? 'Sudah diputar' : '▶ Lihat caranya'}</button>
              {finished
                ? <button className="btn primary" onClick={restart}>Ulang kuis ({score.ok}/{ROUND})</button>
                : <button className="btn primary" onClick={next} disabled={busy}>Soal berikutnya</button>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
