import { useCallback, useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import ScanFlow from './components/ScanFlow.jsx';
import Editor from './components/Editor.jsx';
import Setup from './components/Setup.jsx';
import Player from './components/Player.jsx';
import Learn from './components/Learn.jsx';
import Lesson from './components/Lesson.jsx';
import CourseLesson from './components/CourseLesson.jsx';
import Methods from './components/Methods.jsx';
import Notation from './components/Notation.jsx';
import Tips from './components/Tips.jsx';
import BottomNav from './components/BottomNav.jsx';
import { load, save } from './storage.js';
import { applyMoves, solvedState, randomScramble, DEFAULT_SCHEME } from './core/cube.js';
import { rotateFace } from './core/scheme.js';
import { COURSES, progressKey } from './content/courses.js';

function emptyDraft(N) {
  const s = new Array(6 * N * N).fill(6);
  if (N % 2 === 1) {
    const m = (N - 1) / 2;
    for (let f = 0; f < 6; f++) s[f * N * N + m * N + m] = DEFAULT_SCHEME[f];
  }
  return s;
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [flow, setFlow] = useState(null);
  const [N, setN] = useState(() => load('N', 3));
  const [draft, setDraft] = useState(null);
  const [scanSamples, setScanSamples] = useState(null); // RGB hasil foto, untuk acuan foto ulang satu sisi
  const [scramble, setScramble] = useState(null);
  const [result, setResult] = useState(() => load('result', null));
  const [pos, setPos] = useState(() => load('pos', 0));
  const [progress, setProgress] = useState(() => load('course', {}));
  useEffect(() => { save('course', progress); }, [progress]);

  useEffect(() => { save('N', N); }, [N]);
  useEffect(() => { save('result', result); }, [result]);
  useEffect(() => { save('pos', pos); }, [pos]);
  useEffect(() => { window.scrollTo(0, 0); }, [flow, tab]);

  // tombol "kembali" perangkat menutup alur yang sedang terbuka
  useEffect(() => {
    if (!flow) return undefined;
    const onPop = () => setFlow(flow.name === 'scanFace' ? { name: 'edit', from: flow.from } : null);
    window.history.pushState({ flow: flow.name }, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [flow ? flow.name : null]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => setFlow(null), []);

  const startScan = () => { setScramble(null); setFlow({ name: 'scan' }); };
  const startManual = () => { setScramble(null); setScanSamples(null); setDraft(emptyDraft(N)); setFlow({ name: 'edit', from: 'manual' }); };
  const startPractice = () => {
    const scr = randomScramble(N);
    setScramble(scr);
    setDraft(Array.from(applyMoves(solvedState(N), N, scr)));
    setFlow({ name: 'setup' });
  };
  const resume = () => setFlow({ name: 'solve' });

  let content;
  if (flow?.name === 'scan') {
    content = (
      <ScanFlow N={N} onCancel={close} onManual={startManual}
        onDone={(d) => { setDraft(d.labels); setScanSamples(d.samples); setFlow({ name: 'edit', from: 'scan', check: Date.now() }); }} />
    );
  } else if (flow?.name === 'scanFace') {
    const backToEdit = (check) => setFlow({ name: 'edit', from: flow.from, check, face: flow.face });
    content = (
      <ScanFlow key={'face' + flow.face} N={N} only={flow.face} reference={{ labels: draft, samples: scanSamples }}
        onCancel={() => backToEdit(null)}
        onDone={(d) => {
          const n2 = N * N;
          const next = draft.slice();
          d.labels.forEach((c, i) => { next[d.face * n2 + i] = c; });
          const smp = scanSamples ? scanSamples.slice() : new Array(6 * n2).fill(null);
          d.samples.forEach((rgb, i) => { smp[d.face * n2 + i] = rgb; });
          setDraft(next); setScanSamples(smp);
          backToEdit(Date.now());
        }} />
    );
  } else if (flow?.name === 'edit') {
    content = (
      <Editor N={N} draft={draft} from={flow.from} autoCheck={flow.check} initialFace={flow.face}
        onChange={(next, rotations) => {
          setDraft(next);
          // sampel foto ikut diputar supaya tetap cocok dengan labelnya (dipakai saat foto ulang satu sisi)
          if (rotations && rotations.length) {
            setScanSamples((smp) => {
              if (!smp) return smp;
              let out = smp;
              for (const r of rotations) for (let t = 0; t < r.turns; t++) out = rotateFace(out, N, r.face, 1);
              return out;
            });
          }
        }} onBack={close} onRescan={startScan}
        onRescanFace={(f) => setFlow({ name: 'scanFace', face: f, from: flow.from })}
        onNext={() => setFlow({ name: 'setup' })} />
    );
  } else if (flow?.name === 'setup') {
    content = (
      <Setup N={N} draft={draft} scramble={scramble}
        onBack={() => (scramble ? close() : setFlow({ name: 'edit', from: scanSamples ? 'scan' : 'manual' }))}
        onEdit={() => setFlow({ name: 'edit', from: scanSamples ? 'scan' : 'manual' })}
        onSolved={(r) => { setResult(r); setPos(0); setFlow({ name: 'solve' }); }} />
    );
  } else if (flow?.name === 'solve' && result) {
    content = <Player result={result} pos={pos} onPos={setPos} onExit={close} onNew={() => { setResult(null); setPos(0); close(); }} />;
  } else if (flow?.name === 'course') {
    const cid = flow.course || '3x3';
    const key = progressKey(cid, COURSES[cid].lessons[flow.index].id);
    content = (
      <CourseLesson key={cid + flow.index} courseId={cid} index={flow.index} done={!!progress[key]}
        onToggleDone={() => setProgress((p) => ({ ...p, [key]: !p[key] }))}
        onBack={() => (flow.back ? setFlow(flow.back) : close())}
        onGo={(i) => { setProgress((p) => ({ ...p, [key]: true })); setFlow({ name: 'course', course: cid, index: i, back: flow.back }); }}
        onOpenCourse={(c, i) => setFlow({ name: 'course', course: c, index: i, back: { name: 'course', course: cid, index: flow.index } })} />
    );
  } else if (flow?.name === 'lesson') {
    content = <Lesson N={flow.N} method={flow.method} onBack={close} />;
  } else if (flow?.name === 'methods') {
    content = <Methods onBack={close} />;
  } else if (tab === 'learn') {
    content = <Learn progress={progress} onCourse={(c, i) => setFlow({ name: 'course', course: c, index: i })} onOpen={(n, m) => setFlow({ name: 'lesson', N: n, method: m })} onMethods={() => setFlow({ name: 'methods' })} />;
  } else if (tab === 'notation') {
    content = <Notation />;
  } else if (tab === 'tips') {
    content = <Tips />;
  } else {
    content = <Home N={N} setN={setN} result={result} pos={pos} onScan={startScan} onManual={startManual} onPractice={startPractice} onResume={resume} />;
  }

  return (
    <div className="app">
      {content}
      {!flow && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  );
}
