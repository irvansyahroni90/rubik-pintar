import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Kubus panduan: menunjukkan cara memutar SELURUH kubus sebelum difoto,
// dilihat dari posisi pemain/kamera. Tiap sisi diberi nama, sisi yang akan difoto berwarna kuning.

export const FACE_NAME = ['ATAS', 'KANAN', 'DEPAN', 'BAWAH', 'KIRI', 'BELAKANG'];

// Gerakan seluruh kubus (sumbu dunia). deg positif = kaidah tangan kanan.
export const SEG = {
  left: { axis: 'y', deg: -90, arrow: 'left', caption: 'Putar seluruh kubus ke KIRI ¼ putaran. Sisi atas tetap di atas.' },
  right: { axis: 'y', deg: 90, arrow: 'right', caption: 'Putar seluruh kubus ke KANAN ¼ putaran. Sisi atas tetap di atas.' },
  backFromLeft: { axis: 'y', deg: -90, arrow: 'left', caption: 'Putar ke KIRI ¼ lagi, sampai sisi DEPAN kembali menghadap kamera.' },
  tiltToward: { axis: 'x', deg: 90, arrow: 'down', caption: 'Miringkan kubus ke arah kamera: sisi ATAS jadi menghadap kamera, sisi DEPAN turun ke bawah.' },
  backFromTop: { axis: 'x', deg: -90, arrow: 'up', caption: 'Kembalikan dulu: sisi DEPAN menghadap kamera lagi, ATAS di atas.' },
  tiltAway: { axis: 'x', deg: -90, arrow: 'up', caption: 'Miringkan kubus menjauh: sisi BAWAH jadi menghadap kamera, sisi DEPAN naik ke atas.' },
};

const AXIS = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0) };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function quatOf(list) {
  const q = new THREE.Quaternion();
  for (const s of list) {
    const r = new THREE.Quaternion().setFromAxisAngle(AXIS[s.axis], THREE.MathUtils.degToRad(s.deg));
    q.premultiply(r);
  }
  return q;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function faceTexture(N, label, target, swatch) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = target ? '#ffd23f' : '#e3eaf8';
  roundRect(g, 0, 0, S, S, 40); g.fill();
  const pad = 22; const gap = 10;
  const cell = (S - 2 * pad - (N - 1) * gap) / N;
  g.fillStyle = target ? '#ffe680' : '#ffffff';
  for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) {
    roundRect(g, pad + k * (cell + gap), pad + r * (cell + gap), cell, cell, Math.min(24, cell * 0.2)); g.fill();
  }
  // pita label
  const fs = label.length > 6 ? 70 : 84;
  g.font = `800 ${fs}px "Baloo 2", "Plus Jakarta Sans", system-ui, sans-serif`;
  const tw = g.measureText(label).width;
  const bw = tw + 60 + (swatch ? 70 : 0); const bh = fs + 34;
  const bx = (S - bw) / 2; const by = S / 2 - bh / 2 - (target ? 26 : 0);
  g.fillStyle = target ? '#1b2a4a' : 'rgba(27,42,74,0.9)';
  roundRect(g, bx, by, bw, bh, bh / 2); g.fill();
  g.fillStyle = target ? '#ffd23f' : '#ffffff';
  g.textAlign = 'left'; g.textBaseline = 'middle';
  let tx = bx + 30;
  if (swatch) {
    g.fillStyle = swatch;
    roundRect(g, tx, S / 2 - 24 - (target ? 26 : 0), 48, 48, 12); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.stroke();
    tx += 70;
    g.fillStyle = target ? '#ffd23f' : '#ffffff';
  }
  g.fillText(label, tx, by + bh / 2 + 4);
  if (target) {
    g.font = '800 40px "Plus Jakarta Sans", system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillStyle = '#1b2a4a';
    g.fillText('FOTO SISI INI', S / 2, by + bh + 50);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Penempatan bidang tiap sisi (urutan U R F D L B)
const FACE_PLACE = [
  { pos: [0, 1, 0], rot: [-Math.PI / 2, 0, 0] },
  { pos: [1, 0, 0], rot: [0, Math.PI / 2, 0] },
  { pos: [0, 0, 1], rot: [0, 0, 0] },
  { pos: [0, -1, 0], rot: [Math.PI / 2, 0, 0] },
  { pos: [-1, 0, 0], rot: [0, -Math.PI / 2, 0] },
  { pos: [0, 0, -1], rot: [0, Math.PI, 0] },
];

function Arrow({ dir }) {
  if (!dir) return null;
  const paths = {
    left: 'M 74 88 Q 50 100 26 88',
    right: 'M 26 88 Q 50 100 74 88',
    down: 'M 90 22 Q 102 50 90 78',
    up: 'M 90 78 Q 102 50 90 22',
  };
  return (
    <svg className="guide-arrow" viewBox="0 0 110 110" aria-hidden="true">
      <defs>
        <marker id="gah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2f6bff" />
        </marker>
      </defs>
      <path d={paths[dir]} fill="none" stroke="#2f6bff" strokeWidth="4.5" strokeLinecap="round" markerEnd="url(#gah)" />
    </svg>
  );
}

/**
 * @param {{N:number, start:object[], segments:object[], target:number, swatches?:(string|null)[], intro?:string, done?:string}} props
 */
export default function GuideCube({ N, start = [], segments = [], target, swatches = [], intro, done }) {
  const hostRef = useRef(null);
  const [phase, setPhase] = useState(-1); // -1 = awal, i = segmen ke-i, segments.length = selesai
  const key = JSON.stringify([N, start, segments, target, swatches]);

  useEffect(() => {
    const host = hostRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(2.4, 2.9, 9.5);
    camera.lookAt(0, -0.15, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa8c8, 2.4));
    const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(3, 6, 8); scene.add(dl);

    const cube = new THREE.Group(); scene.add(cube);
    const H = 1.25;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * H - 0.02, 2 * H - 0.02, 2 * H - 0.02), new THREE.MeshStandardMaterial({ color: 0x1b2333, roughness: 0.6 }));
    cube.add(body);
    const plane = new THREE.PlaneGeometry(2 * H - 0.06, 2 * H - 0.06);
    const mats = [];
    FACE_PLACE.forEach((fp, f) => {
      const m = new THREE.MeshStandardMaterial({ map: faceTexture(N, FACE_NAME[f], f === target, swatches[f]), roughness: 0.55 });
      mats.push(m);
      const mesh = new THREE.Mesh(plane, m);
      mesh.position.set(fp.pos[0] * (H + 0.005), fp.pos[1] * (H + 0.005), fp.pos[2] * (H + 0.005));
      mesh.rotation.set(...fp.rot);
      cube.add(mesh);
    });

    const q0 = quatOf(start);
    const segQ = segments.map((s) => new THREE.Quaternion().setFromAxisAngle(AXIS[s.axis], THREE.MathUtils.degToRad(s.deg)));
    const ends = [];
    let acc = q0.clone();
    segQ.forEach((q) => { acc = acc.clone().premultiply(q); ends.push(acc.clone()); });
    cube.quaternion.copy(q0);

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DUR = 2100; const GAP = 700; const HOLD0 = 1100; const HOLD_END = 1900;
    const cycle = HOLD0 + segments.length * (DUR + GAP) + HOLD_END;

    function resize() {
      const w = host.clientWidth; const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.fov = w / h < 0.9 ? 36 : 30;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize); ro.observe(host);
    resize();

    let raf = 0; let lastPhase = null;
    const t0 = performance.now();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      let ph; let q;
      if (reduce || !segments.length) {
        ph = segments.length ? segments.length : -1;
        q = segments.length ? ends[ends.length - 1] : q0;
      } else {
        let t = (now - t0) % cycle;
        if (t < HOLD0) { ph = -1; q = q0; } else {
          t -= HOLD0;
          const i = Math.floor(t / (DUR + GAP));
          if (i >= segments.length) { ph = segments.length; q = ends[ends.length - 1]; } else {
            const local = t - i * (DUR + GAP);
            const from = i === 0 ? q0 : ends[i - 1];
            const k = Math.min(1, local / DUR);
            q = new THREE.Quaternion().setFromAxisAngle(AXIS[segments[i].axis], THREE.MathUtils.degToRad(segments[i].deg) * ease(k)).multiply(from);
            ph = local < DUR ? i : (i + 1 < segments.length ? i : segments.length);
          }
        }
      }
      cube.quaternion.copy(q);
      if (ph !== lastPhase) { lastPhase = ph; setPhase(ph); }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mats.forEach((m) => { m.map.dispose(); m.dispose(); });
      plane.dispose(); body.geometry.dispose(); body.material.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) { /* abaikan */ }
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const seg = phase >= 0 && phase < segments.length ? segments[phase] : null;
  let caption;
  if (seg) caption = segments.length > 1 ? `${phase + 1}. ${seg.caption}` : seg.caption;
  else if (phase === -1) caption = intro || 'Posisi awal kubus.';
  else caption = done || 'Sekarang sisi kuning menghadap kamera — siap difoto.';

  return (
    <div className="guide">
      <div className="guide-stage">
        <div ref={hostRef} className="guide-canvas" />
        <Arrow dir={seg ? seg.arrow : null} />
        <span className="guide-you">📱 kamu & kamera di sini</span>
      </div>
      <p className="guide-caption" aria-live="polite">{caption}</p>
      {segments.length > 1 && (
        <div className="guide-dots" aria-hidden="true">
          {segments.map((s, i) => <i key={i} className={i === phase ? 'on' : i < phase ? 'done' : ''} />)}
        </div>
      )}
    </div>
  );
}
