import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STICKER_HEX } from '../three/CubeView.jsx';
import GuideCube, { SEG } from '../three/GuideCube.jsx';
import { quickClassify, classifyAll, classifyFace, sampleGrid } from '../scan/colors.js';
import { TopBar, COLOR_LABEL } from './common.jsx';
import { FACE_TITLE, NEIGHBORS } from './faces.js';

// Urutan scan lengkap: Depan, Kanan, Belakang, Kiri, Atas, Bawah
const FULL = [
  { face: 2, start: [], segs: [], intro: 'Pilih satu sisi sebagai DEPAN dan hadapkan ke kamera. Ingat sisi ATAS-nya — jangan berubah sampai foto ke-4.', how: 'Hadapkan sisi pilihanmu ke kamera. Ingat mana sisi atasnya.' },
  { face: 1, start: [], segs: [SEG.left], intro: 'Mulai dari posisi foto tadi: sisi DEPAN menghadap kamera.', how: 'Putar seluruh kubus ke kiri ¼ putaran. Atas tetap di atas.' },
  { face: 5, start: [SEG.left], segs: [SEG.left], intro: 'Mulai dari posisi foto tadi: sisi KANAN menghadap kamera.', how: 'Putar lagi ke kiri ¼ putaran. Atas tetap di atas.' },
  { face: 4, start: [SEG.left, SEG.left], segs: [SEG.left], intro: 'Mulai dari posisi foto tadi: sisi BELAKANG menghadap kamera.', how: 'Putar lagi ke kiri ¼ putaran. Atas tetap di atas.' },
  { face: 0, start: [SEG.left, SEG.left, SEG.left], segs: [SEG.backFromLeft, SEG.tiltToward], intro: 'Mulai dari posisi foto tadi: sisi KIRI menghadap kamera. Ada 2 gerakan.', how: 'Kembalikan DEPAN ke kamera, lalu miringkan ke arah kamera. DEPAN harus di bawah foto.' },
  { face: 3, start: [SEG.tiltToward], segs: [SEG.backFromTop, SEG.tiltAway], intro: 'Mulai dari posisi foto tadi: sisi ATAS menghadap kamera. Ada 2 gerakan.', how: 'Kembalikan DEPAN ke kamera, lalu miringkan menjauh. DEPAN harus di atas foto.' },
];
// Foto ulang satu sisi: selalu mulai dari posisi awal (DEPAN menghadap kamera)
const SINGLE_SEGS = { 2: [], 1: [SEG.left], 5: [SEG.left, SEG.left], 4: [SEG.right], 0: [SEG.tiltToward], 3: [SEG.tiltAway] };
const SINGLE_HOW = {
  2: 'Hadapkan sisi DEPAN ke kamera, ATAS di atas.',
  1: 'Dari posisi awal, putar seluruh kubus ke kiri ¼ putaran.',
  5: 'Dari posisi awal, putar seluruh kubus ke kiri 2× (½ putaran).',
  4: 'Dari posisi awal, putar seluruh kubus ke kanan ¼ putaran.',
  0: 'Dari posisi awal, miringkan ke arah kamera. DEPAN harus di bawah foto.',
  3: 'Dari posisi awal, miringkan menjauh. DEPAN harus di atas foto.',
};

function cropRect(cw, ch, vw, vh) {
  const scale = Math.max(cw / vw, ch / vh);
  const offX = (cw - vw * scale) / 2; const offY = (ch - vh * scale) / 2;
  const size = cw * 0.72;
  const x = (cw - size) / 2; const y = (ch - size) / 2;
  return { x: (x - offX) / scale, y: (y - offY) / scale, size: size / scale };
}

/**
 * Mode lengkap: 6 foto. Mode satu sisi: prop `only` = indeks sisi, `reference` = {labels, samples}.
 */
export default function ScanFlow({ N, only = null, reference = null, onCancel, onDone, onManual }) {
  const n2 = N * N;
  const single = only !== null && only !== undefined;
  const steps = useMemo(() => (single
    ? [{ face: only, start: [], segs: SINGLE_SEGS[only], intro: 'Pegang seperti saat foto pertama: sisi DEPAN menghadap kamera, ATAS di atas.', how: SINGLE_HOW[only] }]
    : FULL), [single, only]);
  const [step, setStep] = useState(0);
  const [samples, setSamples] = useState(() => (reference && reference.samples ? reference.samples.slice() : new Array(6 * n2).fill(null)));
  const [frozen, setFrozen] = useState(null); // {url, rgb[]}
  const [live, setLive] = useState(null);
  const [camErr, setCamErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  // warna tengah yang sudah diketahui (kubus ganjil) → ditampilkan di panduan & label tepi
  const knownCenter = useMemo(() => {
    const out = new Array(6).fill(null);
    if (N % 2 === 0) return out;
    const m = (N - 1) / 2;
    for (let f = 0; f < 6; f++) {
      const i = f * n2 + m * N + m;
      if (reference && reference.labels && reference.labels[i] < 6) out[f] = reference.labels[i];
      else if (samples[i]) out[f] = quickClassify(samples[i]);
    }
    return out;
  }, [samples, reference, N, n2]);

  // kamera
  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setCamErr('Kamera tidak tersedia di browser ini.'); return; }
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}); }
      } catch (e) {
        setCamErr(e && e.name === 'NotAllowedError' ? 'Izin kamera ditolak. Kamu bisa unggah foto atau isi warna manual.' : 'Kamera tidak bisa dibuka. Coba unggah foto atau isi warna manual.');
      }
    }
    start();
    return () => { cancelled = true; if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); };
  }, []);

  const grab = useCallback((source, sw, sh) => {
    const wrap = wrapRef.current;
    if (!wrap || !sw || !sh) return null;
    const cw = wrap.clientWidth; const ch = wrap.clientHeight;
    const r = cropRect(cw, ch, sw, sh);
    const c = canvasRef.current || (canvasRef.current = document.createElement('canvas'));
    const S = 300;
    c.width = S; c.height = S;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(source, r.x, r.y, r.size, r.size, 0, 0, S, S);
    return { rgb: sampleGrid(g, 0, 0, S, N), url: c.toDataURL('image/jpeg', 0.7) };
  }, [N]);

  // pratinjau langsung
  useEffect(() => {
    if (frozen || camErr || showGuide) return undefined;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      const res = grab(v, v.videoWidth, v.videoHeight);
      if (res) setLive(res.rgb.map(quickClassify));
    }, 400);
    return () => clearInterval(id);
  }, [frozen, camErr, showGuide, grab]);

  const capture = () => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;
    const res = grab(v, v.videoWidth, v.videoHeight);
    if (res) setFrozen(res);
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { const res = grab(img, img.naturalWidth, img.naturalHeight); if (res) { setShowGuide(false); setFrozen(res); } URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(f);
    e.target.value = '';
  };

  const cur = steps[Math.min(step, steps.length - 1)];
  const last = step === steps.length - 1;

  const accept = () => {
    if (!frozen) return;
    const face = cur.face;
    const next = samples.slice();
    frozen.rgb.forEach((rgb, i) => { next[face * n2 + i] = rgb; });
    setSamples(next);
    setFrozen(null);
    if (last) {
      setBusy(true);
      setTimeout(() => {
        if (single) {
          const faceLabels = classifyFace(frozen.rgb, face, reference.labels, reference.samples, N);
          onDone({ face, labels: faceLabels, samples: frozen.rgb });
        } else {
          onDone({ labels: classifyAll(next, N), samples: next });
        }
      }, 50);
      return;
    }
    setStep(step + 1);
    setLive(null);
    setShowGuide(true);
  };

  const grid = frozen ? frozen.rgb.map(quickClassify) : live;
  const nb = NEIGHBORS[cur.face];
  // tepi terpenting: ATAS untuk sisi samping, DEPAN untuk foto atas/bawah
  const keyEdge = cur.face === 0 ? 2 : 0;
  const swatches = knownCenter.map((c) => (c == null ? null : STICKER_HEX[c]));
  const edgeLabel = (pos) => {
    const f = nb[pos];
    const c = knownCenter[f];
    const arrow = ['⬆', '➡', '⬇', '⬅'][pos];
    return (
      <span key={pos} className={`edge-tag e${pos}${pos === keyEdge ? ' key' : ''}`}>
        {pos !== 1 && pos !== 3 ? arrow + ' ' : ''}{FACE_TITLE[f].toUpperCase()}
        {c != null && <i style={{ background: STICKER_HEX[c] }} title={COLOR_LABEL[c]} />}
      </span>
    );
  };

  return (
    <main className="screen full">
      <TopBar
        title={single ? `Foto ulang sisi ${FACE_TITLE[cur.face]}` : `Scan ${N}x${N}`}
        sub={single ? 'Sisi lain tidak berubah' : `Foto ${step + 1} dari 6 · sisi ${FACE_TITLE[cur.face]}`}
        onBack={onCancel}
        right={!showGuide && <button className="btn small" onClick={() => { setFrozen(null); setShowGuide(true); }}>❓ Cara putar</button>}
      />
      {!single && <div className="scan-steps" aria-hidden="true">{steps.map((s, i) => <span key={i} className={i < step ? 'done' : i === step ? 'cur' : ''} />)}</div>}
      <p className="scan-how"><b>Sisi {FACE_TITLE[cur.face]}:</b> {cur.how}</p>
      <div className="scan-wrap" ref={wrapRef}>
        {!camErr && <video ref={videoRef} playsInline muted autoPlay style={{ visibility: frozen || showGuide ? 'hidden' : 'visible' }} />}
        {frozen && <img className="scan-frozen" src={frozen.url} alt="Hasil foto sisi" />}
        {!showGuide && (
          <>
            <div className="scan-guide" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
              {Array.from({ length: n2 }, (_, i) => (
                <div className="cell" key={i}>{grid && grid[i] != null && <span className="dot" style={{ background: STICKER_HEX[grid[i]] }} />}</div>
              ))}
              {[0, 1, 2, 3].map(edgeLabel)}
            </div>
            <div className="scan-hint">{frozen ? 'Cek titik warnanya. Sudah cocok dengan kubusmu?' : (camErr || 'Paskan kubus di kotak. Cahaya terang, tanpa bayangan.')}</div>
          </>
        )}
        {showGuide && (
          <div className="guide-overlay">
            <GuideCube
              N={N}
              start={cur.start}
              segments={cur.segs}
              target={cur.face}
              swatches={swatches}
              intro={cur.intro}
              done={`Sisi ${FACE_TITLE[cur.face].toUpperCase()} (kuning) sekarang menghadap kamera. ${cur.face === 0 ? 'DEPAN ada di bawah.' : cur.face === 3 ? 'DEPAN ada di atas.' : 'ATAS tetap di atas.'}`}
            />
            <button className="btn primary block" onClick={() => setShowGuide(false)}>Siap, foto sisi {FACE_TITLE[cur.face].toLowerCase()}</button>
          </div>
        )}
      </div>
      {busy ? (
        <button className="btn primary block" disabled>Mengenali warna…</button>
      ) : showGuide ? null : frozen ? (
        <div className="action-row">
          <button className="btn" onClick={() => setFrozen(null)}>Foto ulang</button>
          <button className="btn primary" onClick={accept}>{last ? (single ? 'Pakai, kembali cek' : 'Selesai, cek warna') : 'Pakai foto ini'}</button>
        </div>
      ) : (
        <div className="action-stack">
          {!camErr && <button className="btn primary block" onClick={capture}><span className="ico" aria-hidden="true">📸</span>Ambil foto sisi {FACE_TITLE[cur.face].toLowerCase()}</button>}
          <div className="action-row">
            <button className="btn" onClick={() => fileRef.current && fileRef.current.click()}>🖼️ Unggah foto</button>
            {onManual ? <button className="btn" onClick={onManual}>🎨 Isi manual</button> : <button className="btn" onClick={onCancel}>Batal</button>}
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <p className="muted small">{single ? 'Hanya sisi ini yang diganti. Koreksi di sisi lain tetap aman.' : 'Warna atau sisi yang salah bisa diperbaiki di langkah berikutnya, tanpa mengulang semuanya.'}</p>
    </main>
  );
}
