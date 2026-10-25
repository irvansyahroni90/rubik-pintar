import { useCallback, useEffect, useState } from 'react';
import Home from './components/Home.jsx';
import ScanFlow from './components/ScanFlow.jsx';
import Editor from './components/Editor.jsx';
import Setup from './components/Setup.jsx';
import Player from './components/Player.jsx';
import Learn from './components/Learn.jsx';
import Lesson from './components/Lesson.jsx';
import Methods from './components/Methods.jsx';
import Notation from './components/Notation.jsx';
import Tips from './components/Tips.jsx';
import BottomNav from './components/BottomNav.jsx';
import { load, save } from './storage.js';
import { applyMoves, solvedState, randomScramble, DEFAULT_SCHEME } from './core/cube.js';

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
  const [scramble, setScramble] = useState(null);
  const [result, setResult] = useState(() => load('result', null));
  const [pos, setPos] = useState(() => load('pos', 0));

  useEffect(() => { save('N', N); }, [N]);
  useEffect(() => { save('result', result); }, [result]);
  useEffect(() => { save('pos', pos); }, [pos]);
  useEffect(() => { window.scrollTo(0, 0); }, [flow, tab]);

  // tombol "kembali" perangkat menutup alur yang sedang terbuka
  useEffect(() => {
    if (!flow) return undefined;
    const onPop = () => setFlow(null);
    window.history.pushState({ flow: flow.name }, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [flow ? flow.name : null]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => setFlow(null), []);

  const startScan = () => { setScramble(null); setFlow({ name: 'scan' }); };
  const startManual = () => { setScramble(null); setDraft(emptyDraft(N)); setFlow({ name: 'edit', from: 'manual' }); };
  const startPractice = () => {
    const scr = randomScramble(N);
    setScramble(scr);
    setDraft(Array.from(applyMoves(solvedState(N), N, scr)));
    setFlow({ name: 'setup' });
  };
  const resume = () => setFlow({ name: 'solve' });

  let content;
  if (flow?.name === 'scan') {
    content = <ScanFlow N={N} onCancel={close} onManual={startManual} onDone={(d) => { setDraft(d); setFlow({ name: 'edit', from: 'scan' }); }} />;
  } else if (flow?.name === 'edit') {
    content = <Editor N={N} draft={draft} from={flow.from} onChange={setDraft} onBack={close} onRescan={startScan} onNext={() => setFlow({ name: 'setup' })} />;
  } else if (flow?.name === 'setup') {
    content = (
      <Setup N={N} draft={draft} scramble={scramble}
        onBack={() => (scramble ? close() : setFlow({ name: 'edit', from: 'scan' }))}
        onEdit={() => setFlow({ name: 'edit', from: 'scan' })}
        onSolved={(r) => { setResult(r); setPos(0); setFlow({ name: 'solve' }); }} />
    );
  } else if (flow?.name === 'solve' && result) {
    content = <Player result={result} pos={pos} onPos={setPos} onExit={close} onNew={() => { setResult(null); setPos(0); close(); }} />;
  } else if (flow?.name === 'lesson') {
    content = <Lesson N={flow.N} method={flow.method} onBack={close} />;
  } else if (flow?.name === 'methods') {
    content = <Methods onBack={close} />;
  } else if (tab === 'learn') {
    content = <Learn onOpen={(n, m) => setFlow({ name: 'lesson', N: n, method: m })} onMethods={() => setFlow({ name: 'methods' })} />;
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
