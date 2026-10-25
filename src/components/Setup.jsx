import { useEffect, useMemo, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { applyMoves } from '../core/cube.js';
import { validate, orientationMoves, centerColors, oppositesFromCorners } from '../core/scheme.js';
import { METHODS } from '../core/solver/index.js';
import { solveAsync } from '../solveAsync.js';
import { TopBar, COLOR_LABEL, Loader } from './common.jsx';

export default function Setup({ N, draft, scramble, onBack, onEdit, onSolved }) {
  const v = useMemo(() => validate(Uint8Array.from(draft), N), [draft, N]);
  const opp = useMemo(() => {
    if (!v.ok) return null;
    if (N % 2 === 1) { const cc = centerColors(draft, N); const o = new Array(6); [[0, 3], [1, 4], [2, 5]].forEach(([a, b]) => { o[cc[a]] = cc[b]; o[cc[b]] = cc[a]; }); return o; }
    return oppositesFromCorners(Uint8Array.from(draft), N);
  }, [v.ok, draft, N]);

  const initial = useMemo(() => {
    if (!v.ok) return { top: 1, front: 4 };
    const cc = N % 2 === 1 ? centerColors(draft, N) : null;
    const top = 1;
    const adj = [0, 1, 2, 3, 4, 5].filter((c) => c !== top && c !== opp[top]);
    const front = cc && adj.includes(cc[2]) ? cc[2] : adj.includes(4) ? 4 : adj[0];
    return { top, front };
  }, [v.ok, draft, N, opp]);
  const [top, setTop] = useState(initial.top);
  const [front, setFront] = useState(initial.front);
  const [method, setMethod] = useState('lbl');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => { setTop(initial.top); setFront(initial.front); }, [initial]);

  const adjFront = opp ? [0, 1, 2, 3, 4, 5].filter((c) => c !== top && c !== opp[top]) : [];
  const pickTop = (c) => {
    setTop(c);
    if (front === c || (opp && front === opp[c])) setFront([0, 1, 2, 3, 4, 5].find((x) => x !== c && x !== opp[c]));
  };

  const preview = useMemo(() => {
    if (!v.ok || N % 2 === 0) return draft;
    try { return Array.from(applyMoves(draft, N, orientationMoves(Uint8Array.from(draft), N, top, front))); } catch (e) { return draft; }
  }, [v.ok, draft, N, top, front]);

  const go = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await solveAsync({ N, state: draft, method, top, front });
      onSolved(r);
    } catch (e) {
      setErr(e.validation || [e.message]);
      setBusy(false);
    }
  };

  if (busy) return <main className="screen full"><Loader text={N >= 4 ? 'Menyusun langkah… (kubus besar butuh beberapa detik)' : 'Menyusun langkah…'} /></main>;

  return (
    <main className="screen full">
      <TopBar title="Siap menyelesaikan" sub={`Kubus ${N}x${N}`} onBack={onBack} />
      {scramble && (
        <div className="panel">
          <h3>Latihan acak</h3>
          <p className="muted small" style={{ margin: '4px 0 8px' }}>Mau pakai kubus aslimu? Mulai dari kubus yang sudah jadi, pegang putih di atas & hijau di depan, lalu acak dengan:</p>
          <p className="alg-text">{scramble.join(' ')}</p>
        </div>
      )}
      {!v.ok ? (
        <>
          <div className="errors"><b>Warna belum valid</b><ul>{v.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
          <button className="btn primary block" onClick={onEdit}>Perbaiki warna</button>
        </>
      ) : (
        <>
          <div className="stage-cube" style={{ height: 230 }}>
            <CubeView N={N} state={preview} labels />
            <div className="hold-badge"><span>Atas</span><i style={{ width: 18, height: 18, borderRadius: 5, background: STICKER_HEX[top] }} /><span>Depan</span><i style={{ width: 18, height: 18, borderRadius: 5, background: STICKER_HEX[front] }} /></div>
          </div>
          <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h3>Arah pegang</h3>
              <p className="muted small">{N % 2 === 1 ? 'Pilih warna tengah yang di atas dan yang menghadapmu. Pemula biasanya kuning di atas (putih di bawah).' : `Kubus ${N}x${N} tidak punya tengah tetap — pilih warna yang nanti jadi atas & depan.`}</p>
            </div>
            <div>
              <b className="small">Warna atas</b>
              <div className="chip-row" style={{ marginTop: 6 }}>
                {[0, 1, 2, 3, 4, 5].map((c) => <button key={c} className="color-chip" aria-pressed={top === c} aria-label={`Atas ${COLOR_LABEL[c]}`} style={{ background: STICKER_HEX[c] }} onClick={() => pickTop(c)} />)}
              </div>
            </div>
            <div>
              <b className="small">Warna depan (menghadapmu)</b>
              <div className="chip-row" style={{ marginTop: 6 }}>
                {adjFront.map((c) => <button key={c} className="color-chip" aria-pressed={front === c} aria-label={`Depan ${COLOR_LABEL[c]}`} style={{ background: STICKER_HEX[c] }} onClick={() => setFront(c)} />)}
              </div>
            </div>
          </section>
          <section className="list" aria-label="Metode">
            <h3>Metode</h3>
            {METHODS[N].map((m) => (
              <button key={m.id} className="row-item" aria-pressed={method === m.id} onClick={() => setMethod(m.id)} style={method === m.id ? { borderColor: 'var(--ink)', background: '#fffbe8' } : undefined}>
                <span className="badge-sq" style={{ background: method === m.id ? 'var(--sun)' : '#edf2fc' }}>{method === m.id ? '✓' : ''}</span>
                <span className="body"><b>{m.name}<span className={'level ' + m.level}>{m.level}</span></b><span>{m.desc}</span></span>
              </button>
            ))}
          </section>
          {err && <div className="errors"><b>Belum bisa diselesaikan</b><ul>{err.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
          <button className="btn primary block" onClick={go}>Buat langkah penyelesaian</button>
          {!scramble && <button className="btn ghost" onClick={onEdit}>Ubah warna stiker</button>}
        </>
      )}
    </main>
  );
}
