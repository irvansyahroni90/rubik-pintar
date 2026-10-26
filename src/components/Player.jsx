import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { applyMoves, applyMove, invertToken, parseToken, NORMALS, rotQ, geometry } from '../core/cube.js';
import { describeMove } from '../core/notation.js';
import { TopBar, Confetti } from './common.jsx';
import AlgSheet from './AlgSheet.jsx';

function buildIndex(result) {
  const steps = [];
  let start = 0;
  result.stages.forEach((st, si) => st.steps.forEach((step, pi) => {
    steps.push({ ...step, si, pi, start, end: start + step.moves.length });
    start += step.moves.length;
  }));
  return { steps, total: start, all: steps.flatMap((s) => s.moves) };
}

function frameColors(result, all, pos) {
  // warna yang sedang di atas & depan
  const N = result.N;
  if (N % 2 === 1) {
    const s = applyMoves(result.start, N, all.slice(0, pos));
    const m = (N - 1) / 2;
    return { top: s[0 * N * N + m * N + m], front: s[2 * N * N + m * N + m] };
  }
  let vc = result.scheme.slice();
  for (const t of all.slice(0, pos)) {
    if (!/^[xyz]/.test(t)) continue;
    const p = parseToken(t, N);
    const nv = vc.slice();
    for (let f = 0; f < 6; f++) {
      const nn = rotQ(NORMALS[f], p.axis, p.q);
      const k = NORMALS.findIndex((q) => q[0] === nn[0] && q[1] === nn[1] && q[2] === nn[2]);
      nv[k] = vc[f];
    }
    vc = nv;
  }
  return { top: vc[0], front: vc[2] };
}

export default function Player({ result, pos: savedPos, onPos, onExit, onNew }) {
  const N = result.N;
  const idx = useMemo(() => buildIndex(result), [result]);
  const cubeRef = useRef(null);
  const initialCursor = useMemo(() => {
    const p = Math.min(savedPos || 0, idx.total);
    let g = idx.steps.findIndex((s) => p >= s.start && p < s.end);
    if (g < 0) g = p >= idx.total ? idx.steps.length - 1 : 0;
    return { g, m: p - idx.steps[g].start };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [cur, setCur] = useState(initialCursor);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [labels, setLabels] = useState(true);
  const [spot, setSpot] = useState(true);
  const [view, setView] = useState('front');
  const [algSheet, setAlgSheet] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const playRef = useRef(false);
  const curRef = useRef(cur);
  curRef.current = cur;

  const step = idx.steps[cur.g];
  const stage = result.stages[step.si];
  const pos = step.start + cur.m;
  const finished = cur.g === idx.steps.length - 1 && cur.m >= step.moves.length;
  const dur = 420 / speed;

  useEffect(() => { onPos(pos); }, [pos, onPos]);
  const stripRef = useRef(null);
  useEffect(() => {
    const el = stripRef.current && stripRef.current.querySelector('[aria-current="step"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [step.si]);

  const focusAt = useCallback((g, m) => {
    const s = idx.steps[g];
    if (!spot || !s.focus || !s.focus.length) return [];
    const size = 6 * N * N;
    let mark = new Uint8Array(size);
    s.focus.forEach((i) => { mark[i] = 1; });
    for (let k = 0; k < m; k++) mark = applyMove(mark, N, s.moves[k]);
    const out = [];
    mark.forEach((v, i) => { if (v) out.push(i); });
    return out;
  }, [idx, spot, N]);

  const jump = useCallback((g, m) => {
    const c = cubeRef.current;
    const s = idx.steps[g];
    const p = s.start + m;
    if (c) { c.finishNow(); c.setState(applyMoves(result.start, N, idx.all.slice(0, p))); c.setFocus(focusAt(g, m)); }
    setCur({ g, m });
  }, [idx, result, N, focusAt]);

  // posisi awal
  const startState = useMemo(() => applyMoves(result.start, N, idx.all.slice(0, initialCursor.g >= 0 ? idx.steps[initialCursor.g].start + initialCursor.m : 0)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const initialFocus = useMemo(() => focusAt(initialCursor.g, initialCursor.m), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const c = cubeRef.current; if (c) c.setFocus(focusAt(cur.g, cur.m)); }, [spot]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(async () => {
    const { g, m } = curRef.current;
    const s = idx.steps[g];
    if (m < s.moves.length) {
      setCur({ g, m: m + 1 });
      await cubeRef.current?.move(s.moves[m], dur, focusAt(g, m + 1));
      return true;
    }
    if (g < idx.steps.length - 1) {
      setCur({ g: g + 1, m: 0 });
      cubeRef.current?.setFocus(focusAt(g + 1, 0));
      return 'step';
    }
    return false;
  }, [idx, dur, focusAt]);

  const prev = useCallback(async () => {
    const { g, m } = curRef.current;
    const s = idx.steps[g];
    if (m > 0) {
      setCur({ g, m: m - 1 });
      await cubeRef.current?.move(invertToken(s.moves[m - 1]), dur, focusAt(g, m - 1));
      return;
    }
    if (g > 0) jump(g - 1, idx.steps[g - 1].moves.length);
  }, [idx, dur, jump, focusAt]);

  // putar otomatis sampai akhir langkah
  const play = useCallback(async () => {
    if (playRef.current) { playRef.current = false; setPlaying(false); return; }
    playRef.current = true; setPlaying(true);
    const { g } = curRef.current;
    if (curRef.current.m >= idx.steps[g].moves.length) await next();
    const g0 = curRef.current.g;
    while (playRef.current) {
      const { g: gg, m } = curRef.current;
      if (gg !== g0 || m >= idx.steps[gg].moves.length) break;
      await next();
      await new Promise((r) => setTimeout(r, 70 / speed));
    }
    playRef.current = false; setPlaying(false);
  }, [idx, next, speed]);

  const stopPlay = () => { playRef.current = false; setPlaying(false); };
  const nextStep = () => { stopPlay(); const { g } = curRef.current; if (g < idx.steps.length - 1) jump(g + 1, 0); else jump(g, idx.steps[g].moves.length); };
  const prevStep = () => { stopPlay(); const { g, m } = curRef.current; if (m > 0) jump(g, 0); else if (g > 0) jump(g - 1, 0); };
  const gotoStage = (si) => { stopPlay(); const g = idx.steps.findIndex((s) => s.si === si); jump(g, 0); };

  useEffect(() => () => { playRef.current = false; }, []);

  const nowMove = cur.m < step.moves.length ? step.moves[cur.m] : null;
  const meaning = nowMove ? describeMove(nowMove, N) : null;
  const frame = useMemo(() => frameColors(result, idx.all, pos), [result, idx, pos]);
  const stepInStage = stage.steps.indexOf(stage.steps[step.pi]) + 1;
  const hiddenHint = useMemo(() => {
    const f = focusAt(cur.g, cur.m);
    if (!f.length || view !== 'front') return null;
    const faces = new Set(f.map((i) => geometry(N).faceOf[i]));
    if (faces.has(0) || faces.has(1) || faces.has(2)) return null;
    if (faces.has(3)) return 'Keping yang disorot ada di sisi bawah — ketuk ⬇️ untuk melihatnya.';
    return 'Keping yang disorot ada di belakang/kiri — ketuk 🔄 untuk melihatnya.';
  }, [focusAt, cur, view, N]);
  const pct = idx.total ? Math.round((pos / idx.total) * 100) : 100;

  return (
    <main className="screen full">
      <TopBar title={finished ? (result.stageOnly ? 'Tahap selesai' : 'Selesai! 🎉') : stage.title} sub={`Tahap ${step.si + 1} dari ${result.stages.length} · langkah ${stepInStage}/${stage.steps.length}`} onBack={() => { stopPlay(); onExit(); }} />
      <nav className="stage-strip" aria-label="Tahap" ref={stripRef}>
        {result.stages.map((s, si) => (
          <button key={si} className={si < step.si ? 'done' : ''} aria-current={si === step.si ? 'step' : undefined} onClick={() => gotoStage(si)} title={s.title}>
            {si + 1}. {s.title.split(' ')[0]}
          </button>
        ))}
      </nav>
      <div className="stage-cube player-cube">
        <CubeView ref={cubeRef} N={N} state={startState} focus={initialFocus} labels={labels} view={view} />
        <div className="view-tools">
          <button className="btn" aria-pressed={labels} aria-label="Label sisi" title="Label sisi" onClick={() => setLabels(!labels)}>🏷️</button>
          <button className="btn" aria-pressed={spot} aria-label="Sorot keping" title="Sorot keping" onClick={() => setSpot(!spot)}>🔦</button>
          <button className="btn" aria-pressed={view === 'back'} aria-label="Lihat belakang" title="Lihat belakang" onClick={() => setView(view === 'back' ? 'front' : 'back')}>🔄</button>
          <button className="btn" aria-pressed={view === 'bottom'} aria-label="Lihat bawah" title="Lihat bawah" onClick={() => setView(view === 'bottom' ? 'front' : 'bottom')}>⬇️</button>
        </div>
        <div className="hold-badge" aria-label="Arah pegang saat ini">
          <span>Atas</span><i style={{ width: 18, height: 18, borderRadius: 5, background: STICKER_HEX[frame.top], boxShadow: '0 0 0 1px #c7d0e0' }} />
          <span>Depan</span><i style={{ width: 18, height: 18, borderRadius: 5, background: STICKER_HEX[frame.front], boxShadow: '0 0 0 1px #c7d0e0' }} />
        </div>
      </div>
      <div className="progress" aria-label={`Kemajuan ${pct}%`}><i style={{ width: pct + '%' }} /></div>

      {finished && result.stageOnly ? (
        <section className="celebrate">
          <div className="big" aria-hidden="true">✅</div>
          <h2>Tahap {result.stageOnly} selesai</h2>
          <p className="muted">Begitulah tahap ini dikerjakan dari kubus acak, dalam {result.totalMoves} gerakan. Tonton ulang pelan-pelan atau minta contoh lain.</p>
          <div className="action-row" style={{ width: '100%' }}>
            <button className="btn" onClick={() => jump(0, 0)}>Tonton ulang</button>
            <button className="btn primary" onClick={onNew}>Contoh lain</button>
          </div>
          <button className="btn ghost" onClick={onExit}>Kembali ke pelajaran</button>
        </section>
      ) : finished ? (
        <section className="celebrate">
          <Confetti />
          <div className="big" aria-hidden="true">🏆</div>
          <h2>Rubikmu sudah jadi!</h2>
          <p className="muted">Hebat! Coba ulangi dengan acakan baru supaya rumusnya makin nempel di jari.</p>
          <div className="stats">
            <div><b>{result.totalMoves}</b><span>gerakan</span></div>
            <div><b>{result.stages.length}</b><span>tahap</span></div>
            <div><b>{N}x{N}</b><span>ukuran</span></div>
          </div>
          <div className="action-row" style={{ width: '100%' }}>
            <button className="btn" onClick={() => jump(0, 0)}>Tonton ulang</button>
            <button className="btn primary" onClick={onNew}>Rubik baru</button>
          </div>
        </section>
      ) : (
        <>
          <section className="step-card" aria-live="polite">
            <div className="head"><h3>{step.title}</h3><small>{cur.m}/{step.moves.length} gerakan</small></div>
            <p>{step.text}</p>
            {hiddenHint && <p className="small" style={{ color: 'var(--blue-edge)', fontWeight: 700 }}>{hiddenHint}</p>}
            {step.moves.length > 0 && (
              <div className="moves" role="list">
                {step.moves.map((t, i) => (
                  <button key={i} role="listitem" className={(i < cur.m ? 'done' : i === cur.m ? 'now' : '') + (/^[xyz]/.test(t) ? ' rot' : '')}
                    onClick={() => { stopPlay(); jump(cur.g, i); }} aria-label={`Gerakan ${i + 1}: ${t}`}>{t}</button>
                ))}
              </div>
            )}
            {meaning && <div className="move-meaning"><b>{nowMove}</b><span>{meaning.text}</span></div>}
            {!nowMove && step.moves.length > 0 && <div className="move-meaning"><b>✓</b><span>Langkah ini selesai. Tekan ▶︎ untuk langkah berikutnya.</span></div>}
            {step.alg && <button className="btn small" onClick={() => setAlgSheet(step.alg)}>🎬 Pelajari rumus {step.alg}</button>}
          </section>
          <div className="dock">
          <div className="controls">
            <button className="btn" onClick={prevStep} aria-label="Langkah sebelumnya">⏮</button>
            <button className="btn" onClick={() => { stopPlay(); prev(); }} aria-label="Mundur satu gerakan">◀</button>
            <button className="btn primary" onClick={play} aria-label={playing ? 'Jeda' : 'Putar langkah'}>{playing ? '⏸ Jeda' : (nowMove ? '▶ Putar' : '▶ Lanjut')}</button>
            <button className="btn" onClick={() => { stopPlay(); next(); }} aria-label="Maju satu gerakan">▶</button>
            <button className="btn" onClick={nextStep} aria-label="Langkah berikutnya">⏭</button>
          </div>
          <label className="speed">🐢<input type="range" min="0.4" max="2.5" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Kecepatan animasi" />🐇</label>
          </div>
          <section className="tips-box">
            <button className="btn ghost small" style={{ padding: 0, minHeight: 0 }} onClick={() => setShowTips(!showTips)} aria-expanded={showTips}>💡 Tentang tahap ini {showTips ? '▴' : '▾'}</button>
            {showTips && (
              <>
                <p style={{ marginTop: 6 }}>{stage.intro}</p>
                {stage.tips && stage.tips.length > 0 && <ul>{stage.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>}
              </>
            )}
          </section>
        </>
      )}
      {algSheet && <AlgSheet N={N} alg={algSheet} title="Rumus" onClose={() => setAlgSheet(null)} />}
    </main>
  );
}
