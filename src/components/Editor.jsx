import { useEffect, useMemo, useRef, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { validate, rotateFace, findRotationFix } from '../core/scheme.js';
import { TopBar, COLOR_LABEL } from './common.jsx';
import { FACE_TITLE, NEIGHBORS } from './faces.js';
const NET = [[null, 0, null, null], [4, 2, 1, 5], [null, 3, null, null]];

function fixText(fixes) {
  return fixes.map((f) => `${FACE_TITLE[f.face]} ${f.turns === 2 ? '180°' : f.turns === 1 ? '90° ↻' : '90° ↺'}`).join(', ');
}

export default function Editor({ N, draft, from, autoCheck, initialFace, onChange, onBack, onRescan, onRescanFace, onNext }) {
  const n2 = N * N;
  const [face, setFace] = useState(initialFace ?? 2);
  const [paint, setPaint] = useState(0);
  const [notice, setNotice] = useState(null); // {kind, text, prev?}
  const counts = useMemo(() => { const c = new Array(7).fill(0); draft.forEach((x) => { c[x]++; }); return c; }, [draft]);
  const empty = counts[6];
  const countsOk = !empty && counts.slice(0, 6).every((x) => x === n2);
  const v = useMemo(() => (countsOk ? validate(Uint8Array.from(draft), N) : null), [draft, N, countsOk]);
  const lastCheck = useRef(null);

  // Setelah scan / foto ulang: coba betulkan sisi yang terputar secara otomatis
  useEffect(() => {
    if (!autoCheck || lastCheck.current === autoCheck) return;
    lastCheck.current = autoCheck;
    const r = findRotationFix(draft, N);
    if (r) {
      setNotice({ kind: 'fix', text: `Sisi ${fixText(r.fixes)} sepertinya terfoto terputar, jadi sudah aku putar otomatis supaya susunannya cocok.`, prev: draft, fixes: r.fixes });
      onChange(r.state, r.fixes);
      setFace(r.fixes[0].face);
    }
  }, [autoCheck]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCell = (i) => {
    const next = draft.slice();
    next[face * n2 + i] = paint;
    onChange(next);
  };
  const turn = (dir) => { onChange(rotateFace(draft, N, face, dir), [{ face, turns: dir > 0 ? 1 : 3 }]); if (notice && notice.kind !== 'fix') setNotice(null); };
  const tryFix = () => {
    const r = findRotationFix(draft, N);
    if (r) {
      setNotice({ kind: 'fix', text: `Ketemu: sisi ${fixText(r.fixes)} perlu diputar. Sudah aku putar.`, prev: draft, fixes: r.fixes });
      onChange(r.state, r.fixes);
      setFace(r.fixes[0].face);
    } else {
      setNotice({ kind: 'info', text: 'Memutar sisi saja tidak cukup. Kemungkinan ada stiker yang salah warna — cek sisi yang kelihatan janggal, atau foto ulang sisi itu.' });
    }
  };
  const undo = () => {
    if (notice && notice.prev) onChange(notice.prev, (notice.fixes || []).map((f) => ({ face: f.face, turns: 4 - f.turns })));
    setNotice(null);
  };

  const nb = NEIGHBORS[face];

  return (
    <main className="screen full">
      <TopBar title={from === 'scan' ? 'Cek warna' : 'Isi warna'} sub={from === 'scan' ? 'Perbaiki sisi yang salah saja' : 'Pilih warna, lalu ketuk stiker'} onBack={onBack} />
      {notice && (
        <div className={notice.kind === 'fix' ? 'notice ok' : 'notice'} role="status">
          <span>{notice.text}</span>
          <div className="notice-actions">
            {notice.prev && <button className="btn small" onClick={undo}>Batalkan</button>}
            <button className="btn small ghost" onClick={() => setNotice(null)} aria-label="Tutup pemberitahuan">✕</button>
          </div>
        </div>
      )}
      <div className="stage-cube" style={{ height: 190 }}>
        <CubeView N={N} state={draft} labels />
      </div>
      <div className="net" role="group" aria-label="Pilih sisi">
        {NET.flat().map((f, k) => (f === null ? <div key={k} className="slot-empty" /> : (
          <div key={k}>
            <button className="face" aria-pressed={face === f} aria-label={`Sisi ${FACE_TITLE[f]}`} onClick={() => setFace(f)} style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
              {draft.slice(f * n2, (f + 1) * n2).map((c, i) => <i key={i} style={{ background: STICKER_HEX[c] }} />)}
            </button>
            <div className="face-label">{FACE_TITLE[f]}</div>
          </div>
        )))}
      </div>
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="face-head">
          <h3>Sisi {FACE_TITLE[face].toLowerCase()}</h3>
          <button className="btn small" onClick={() => onRescanFace(face)}>📷 Foto ulang sisi ini</button>
        </div>
        <div className="face-frame">
          <span className="nb t">⬆ {FACE_TITLE[nb[0]]}</span>
          <span className="nb r">{FACE_TITLE[nb[1]]}</span>
          <span className="nb b">⬇ {FACE_TITLE[nb[2]]}</span>
          <span className="nb l">{FACE_TITLE[nb[3]]}</span>
          <div className="big-face" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
            {draft.slice(face * n2, (face + 1) * n2).map((c, i) => (
              <button key={i} aria-label={`Stiker ${i + 1}: ${c < 6 ? COLOR_LABEL[c] : 'kosong'}`} style={{ background: STICKER_HEX[c] }} onClick={() => setCell(i)} />
            ))}
          </div>
        </div>
        <div className="action-row">
          <button className="btn" onClick={() => turn(-1)}>↺ Putar kiri</button>
          <button className="btn" onClick={() => turn(1)}>↻ Putar kanan</button>
        </div>
        <p className="muted small">Susunannya benar tapi miring? Putar saja sisinya sampai nama sisi di tepi kotak cocok dengan kubusmu.</p>
        <div className="palette" role="group" aria-label="Warna kuas">
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <button key={c} aria-pressed={paint === c} aria-label={`${COLOR_LABEL[c]} (${counts[c]} dari ${n2})`} style={{ background: STICKER_HEX[c] }} onClick={() => setPaint(c)}>
              <span className={'count' + (counts[c] === n2 ? ' ok' : counts[c] > n2 ? ' over' : '')}>{counts[c]}</span>
            </button>
          ))}
        </div>
        <p className="muted small">Ketuk warna di atas, lalu ketuk stiker yang salah. Setiap warna harus tepat {n2} stiker.{empty ? ` Masih ada ${empty} stiker kosong.` : ''}</p>
      </div>
      {v && !v.ok && (
        <div className="errors">
          <b>Susunan belum cocok</b>
          <ul>{v.errors.slice(0, 2).map((e, i) => <li key={i}>{e}</li>)}</ul>
          <button className="btn small" style={{ marginTop: 8 }} onClick={tryFix}>🔍 Cari sisi yang terputar</button>
        </div>
      )}
      {v && v.ok && <div className="valid-ok">✓ Susunan warna valid — siap diselesaikan.</div>}
      <div className="action-row">
        {from === 'scan' ? <button className="btn" onClick={onRescan}>Scan ulang semua</button> : <button className="btn" onClick={onBack}>Batal</button>}
        <button className="btn primary" disabled={empty > 0} onClick={onNext}>Lanjut</button>
      </div>
    </main>
  );
}
