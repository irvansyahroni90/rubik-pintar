import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CubeView, { STICKER_HEX } from '../three/CubeView.jsx';
import { applyMoves } from '../core/cube.js';
import { quickClassify, classifyAll, sampleGrid } from '../scan/colors.js';
import { TopBar } from './common.jsx';

// Urutan foto: Depan, Kanan, Belakang, Kiri, Atas, Bawah
const STEPS = [
  { face: 2, name: 'Depan', rot: [], how: 'Pilih satu sisi sebagai DEPAN dan arahkan ke kamera. Ingat sisi mana yang di atas — jangan berubah sampai foto ke-4.' },
  { face: 1, name: 'Kanan', rot: ['y'], how: 'Putar seluruh kubus ke kiri ¼ putaran: sisi kanan sekarang menghadap kamera. Sisi atas tetap di atas.' },
  { face: 5, name: 'Belakang', rot: ['y', 'y'], how: 'Putar lagi ke kiri ¼ putaran.' },
  { face: 4, name: 'Kiri', rot: ['y', 'y', 'y'], how: 'Putar lagi ke kiri ¼ putaran.' },
  { face: 0, name: 'Atas', rot: ["x'"], how: 'Putar ke kiri sekali lagi (kembali ke depan awal), lalu miringkan kubus ke arahmu: sisi ATAS menghadap kamera, sisi depan ada di bawah foto.' },
  { face: 3, name: 'Bawah', rot: ['x'], how: 'Kembalikan seperti awal, lalu miringkan kubus menjauh: sisi BAWAH menghadap kamera, sisi depan ada di atas foto.' },
];
const TRANS = [[], ['y'], ['y'], ['y'], ['y', "x'"], ['x2']];

function cropRect(cw, ch, vw, vh) {
  const scale = Math.max(cw / vw, ch / vh);
  const offX = (cw - vw * scale) / 2; const offY = (ch - vh * scale) / 2;
  const size = cw * 0.72;
  const x = (cw - size) / 2; const y = (ch - size) / 2;
  return { x: (x - offX) / scale, y: (y - offY) / scale, size: size / scale };
}

export default function ScanFlow({ N, onCancel, onDone, onManual }) {
  const n2 = N * N;
  const [step, setStep] = useState(0);
  const [samples, setSamples] = useState(() => new Array(6 * n2).fill(null));
  const [frozen, setFrozen] = useState(null); // {url, rgb[]}
  const [live, setLive] = useState(null);
  const [camErr, setCamErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const miniRef = useRef(null);
  const fileRef = useRef(null);

  const preview = useMemo(() => samples.map((s) => (s ? quickClassify(s) : 6)), [samples]);
  const display = useMemo(() => Array.from(applyMoves(preview, N, STEPS[Math.min(step, 5)].rot)), [preview, step, N]);

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
    if (frozen || camErr) return undefined;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      const res = grab(v, v.videoWidth, v.videoHeight);
      if (res) setLive(res.rgb.map(quickClassify));
    }, 400);
    return () => clearInterval(id);
  }, [frozen, camErr, grab]);

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
    img.onload = () => { const res = grab(img, img.naturalWidth, img.naturalHeight); if (res) setFrozen(res); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(f);
    e.target.value = '';
  };

  const accept = async () => {
    if (!frozen) return;
    const face = STEPS[step].face;
    const next = samples.slice();
    frozen.rgb.forEach((rgb, i) => { next[face * n2 + i] = rgb; });
    setSamples(next);
    setFrozen(null);
    if (step === 5) {
      setBusy(true);
      setTimeout(() => onDone(classifyAll(next, N)), 50);
      return;
    }
    // animasi kubus mini ke arah foto berikutnya
    const m = miniRef.current;
    if (m) for (const t of TRANS[step + 1]) await m.move(t, 420);
    setStep(step + 1);
  };

  const cur = STEPS[Math.min(step, 5)];
  const grid = frozen ? frozen.rgb.map(quickClassify) : live;

  return (
    <main className="screen full">
      <TopBar title={`Scan ${N}x${N}`} sub={`Foto ${step + 1} dari 6 · sisi ${cur.name}`} onBack={onCancel} />
      <div className="scan-steps" aria-hidden="true">{STEPS.map((s, i) => <span key={i} className={i < step ? 'done' : i === step ? 'cur' : ''} />)}</div>
      <div className="scan-head">
        <div className="mini"><CubeView ref={miniRef} N={N} state={display} interactive={false} view="front" /></div>
        <div className="txt"><b>Sisi {cur.name}</b><span>{cur.how}</span></div>
      </div>
      <div className="scan-wrap" ref={wrapRef}>
        {!camErr && <video ref={videoRef} playsInline muted autoPlay style={{ visibility: frozen ? 'hidden' : 'visible' }} />}
        {frozen && <img className="scan-frozen" src={frozen.url} alt="Hasil foto sisi" />}
        <div className="scan-guide" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {Array.from({ length: n2 }, (_, i) => (
            <div className="cell" key={i}>{grid && grid[i] != null && <span className="dot" style={{ background: STICKER_HEX[grid[i]] }} />}</div>
          ))}
        </div>
        <div className="scan-hint">{frozen ? 'Cek titik warnanya. Sudah cocok dengan kubusmu?' : (camErr || `Paskan sisi ${cur.name.toLowerCase()} di kotak. Cahaya terang, tanpa bayangan.`)}</div>
      </div>
      {busy ? (
        <button className="btn primary block" disabled>Mengenali warna…</button>
      ) : frozen ? (
        <div className="action-row">
          <button className="btn" onClick={() => setFrozen(null)}>Foto ulang</button>
          <button className="btn primary" onClick={accept}>{step === 5 ? 'Selesai, cek warna' : 'Pakai foto ini'}</button>
        </div>
      ) : (
        <div className="action-stack">
          {!camErr && <button className="btn primary block" onClick={capture}><span className="ico" aria-hidden="true">📸</span>Ambil foto sisi {cur.name.toLowerCase()}</button>}
          <div className="action-row">
            <button className="btn" onClick={() => fileRef.current && fileRef.current.click()}>🖼️ Unggah foto</button>
            <button className="btn" onClick={onManual}>🎨 Isi manual</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
        </div>
      )}
      <p className="muted small">Warna yang salah baca bisa diperbaiki di langkah berikutnya.</p>
    </main>
  );
}
