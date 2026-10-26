import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { parseToken, applyMove, geometry, NORMALS } from '../core/cube.js';
import { cubies } from '../core/pieces.js';

export const STICKER_HEX = ['#F7F9FC', '#FFD23F', '#E8453C', '#FF8A1F', '#1FB86A', '#2F6BFF', '#7E899E'];
const FACE_LABEL = ['Atas · U', 'Kanan · R', 'Depan · F', 'Bawah · D', 'Kiri · L', 'Belakang · B'];

function roundedSquare(size, r) {
  const s = size / 2;
  const sh = new THREE.Shape();
  sh.moveTo(-s + r, -s);
  sh.lineTo(s - r, -s); sh.quadraticCurveTo(s, -s, s, -s + r);
  sh.lineTo(s, s - r); sh.quadraticCurveTo(s, s, s - r, s);
  sh.lineTo(-s + r, s); sh.quadraticCurveTo(-s, s, -s, s - r);
  sh.lineTo(-s, -s + r); sh.quadraticCurveTo(-s, -s, -s + r, -s);
  return new THREE.ShapeGeometry(sh, 4);
}

function labelSprite(text, k = 1) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 72;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(27,42,74,0.86)';
  const r = 32;
  g.beginPath(); g.moveTo(r, 4); g.arcTo(252, 4, 252, 68, r); g.arcTo(252, 68, 4, 68, r); g.arcTo(4, 68, 4, 4, r); g.arcTo(4, 4, 252, 4, r); g.closePath(); g.fill();
  g.fillStyle = '#fff';
  g.font = '700 32px "Plus Jakarta Sans", system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(m);
  sp.scale.set(1.25 * k, 0.35 * k, 1);
  sp.renderOrder = 10;
  return sp;
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const CubeView = forwardRef(function CubeView({ N, state, focus, labels = false, autoRotate = false, interactive = true, view = 'front', className = '', onReady, dim = 0.55, zoom = 1 }, ref) {
  const hostRef = useRef(null);
  const api = useRef({});

  useEffect(() => {
    const host = hostRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 2.2));
    const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(4, 8, 6); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.6); dl2.position.set(-6, -3, -4); scene.add(dl2);

    const root = new THREE.Group(); scene.add(root);
    const pivot = new THREE.Group(); scene.add(pivot);
    const geo = geometry(N);
    const { list } = cubies(N);
    const body = new RoundedBoxGeometry(0.97, 0.97, 0.97, 3, 0.12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b2333, roughness: 0.55, metalness: 0.05 });
    const stickerGeo = roundedSquare(0.84, 0.13);
    const stickerMeshes = new Array(geo.size);
    const cubieObjs = list.map((cb) => {
      const g = new THREE.Group();
      g.position.set(cb.pos[0] / 2, cb.pos[1] / 2, cb.pos[2] / 2);
      g.userData.home = g.position.clone();
      g.userData.pos = cb.pos;
      g.add(new THREE.Mesh(body, bodyMat));
      for (const s of cb.stickers) {
        const n = NORMALS[geo.faceOf[s]];
        const m = new THREE.Mesh(stickerGeo, new THREE.MeshStandardMaterial({ color: STICKER_HEX[6], roughness: 0.35, emissive: 0x000000 }));
        m.position.set(n[0] * 0.492, n[1] * 0.492, n[2] * 0.492);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(n[0], n[1], n[2]));
        g.add(m);
        stickerMeshes[s] = m;
      }
      root.add(g);
      return g;
    });

    const labelSprites = [];
    const h = N / 2;
    const LABEL_POS = [
      [0, h + 0.55, -h + 0.2], [h * 0.8, -h - 0.5, h * 0.75], [-h * 0.45, -h - 0.5, h + 0.1],
      [0, -h - 1.1, 0], [-h * 0.8, -h - 0.5, -h * 0.75], [h * 0.45, -h - 0.5, -h - 0.1],
    ];
    NORMALS.forEach((n, f) => {
      const sp = labelSprite(FACE_LABEL[f], Math.max(1, N / 2.3));
      sp.position.set(...LABEL_POS[f]);
      sp.userData.n = new THREE.Vector3(...n);
      sp.visible = false;
      scene.add(sp); labelSprites.push(sp);
    });
    let labelsOn = false;
    function updateLabels() {
      const cd = camera.position.clone().normalize();
      labelSprites.forEach((sp, f) => { sp.visible = labelsOn && (f === 3 ? cd.y < -0.3 : sp.userData.n.dot(cd) > 0.2); });
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.rotateSpeed = 0.9;
    controls.minDistance = N * 1.8;
    controls.maxDistance = N * 6;
    controls.autoRotateSpeed = 1.2;

    let cur = Uint8Array.from(state || []);
    let focusSet = new Set(focus || []);
    let pendingFocus = null;
    let dirty = true;

    function paint() {
      const hasFocus = focusSet.size > 0;
      for (let i = 0; i < geo.size; i++) {
        const m = stickerMeshes[i];
        const c = cur[i] ?? 6;
        const col = new THREE.Color(STICKER_HEX[c] || STICKER_HEX[6]);
        if (hasFocus && !focusSet.has(i)) col.lerp(new THREE.Color('#9aa4b8'), dim);
        m.material.color.copy(col);
        m.material.emissive.set(hasFocus && focusSet.has(i) ? 0x332200 : 0x000000);
      }
      dirty = true;
    }

    let viewDir = new THREE.Vector3(0.62, 0.62, 1);
    function placeCamera(dirVec) {
      if (dirVec) viewDir = dirVec.clone();
      const w = host.clientWidth || 300; const h = host.clientHeight || 300;
      const aspect = w / h;
      camera.aspect = aspect;
      const radius = (N * 0.92 + 1.15) / zoom;
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
      const fit = Math.min(vfov, hfov);
      const dist = radius / Math.sin(fit / 2) * 1.02;
      camera.position.copy(viewDir.clone().normalize().multiplyScalar(dist));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      controls.update();
      dirty = true;
    }

    function resize() {
      const w = host.clientWidth; const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      placeCamera();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // ---- animasi ----
    let anim = null;
    const queue = [];
    function startNext() {
      if (anim || !queue.length) return;
      const job = queue.shift();
      let p;
      try { p = parseToken(job.tok, N); } catch (e) { job.resolve(); startNext(); return; }
      const layerSet = new Set(p.layers);
      const sel = cubieObjs.filter((g) => layerSet.has((g.userData.pos[p.axis] + (N - 1)) / 2));
      const cwSign = (p.face === 'R' || p.face === 'U' || p.face === 'F') ? -1 : 1;
      const angle = (p.q === 1 ? 1 : p.q === 3 ? -1 : 2 * cwSign) * Math.PI / 2;
      pivot.rotation.set(0, 0, 0);
      pivot.updateMatrixWorld();
      sel.forEach((g) => pivot.attach(g));
      anim = { job, sel, axis: p.axis, angle, t0: performance.now(), dur: Math.max(30, job.dur * (p.times === 2 ? 1.45 : 1)) };
      dirty = true;
    }
    function finishAnim() {
      const { job, sel } = anim;
      pivot.rotation.set(0, 0, 0);
      pivot.updateMatrixWorld();
      sel.forEach((g) => { root.attach(g); g.position.copy(g.userData.home); g.rotation.set(0, 0, 0); });
      cur = applyMove(cur, N, job.tok);
      if (job.focusAfter) {
        focusSet = new Set(job.focusAfter);
      } else if (focusSet.size) {
        // fokus ikut keping
        const next = new Set();
        const tmp = new Uint8Array(geo.size);
        for (const i of focusSet) tmp[i] = 1;
        const moved = applyMove(tmp, N, job.tok);
        moved.forEach((v, i) => { if (v) next.add(i); });
        focusSet = next;
      }
      if (!queue.length && pendingFocus) { focusSet = new Set(pendingFocus); pendingFocus = null; }
      paint();
      anim = null;
      job.resolve();
      startNext();
    }

    let raf = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (anim) {
        const t = Math.min(1, (now - anim.t0) / anim.dur);
        const a = anim.angle * ease(t);
        pivot.rotation.set(anim.axis === 0 ? a : 0, anim.axis === 1 ? a : 0, anim.axis === 2 ? a : 0);
        dirty = true;
        if (t >= 1) finishAnim();
      }
      const changed = controls.update();
      if (changed || dirty) { if (labelsOn) updateLabels(); renderer.render(scene, camera); dirty = false; }
    }
    raf = requestAnimationFrame(loop);

    const VIEWS = {
      front: new THREE.Vector3(0.62, 0.62, 1),
      back: new THREE.Vector3(-0.62, 0.62, -1),
      bottom: new THREE.Vector3(0.62, -0.7, 1),
      straight: new THREE.Vector3(0.0001, 0.0001, 1),
      top: new THREE.Vector3(0.0001, 1, 0.35),
    };

    api.current = {
      setState(s) { if (anim || queue.length) api.current.finishNow(); cur = Uint8Array.from(s); paint(); },
      getState() { return Uint8Array.from(cur); },
      setFocus(f) {
        if (anim || queue.length) { pendingFocus = f || []; return; }
        focusSet = new Set(f || []); paint();
      },
      move(tok, dur = 350, focusAfter) {
        if (focusAfter) pendingFocus = null;
        return new Promise((resolve) => { queue.push({ tok, dur, resolve, focusAfter }); startNext(); });
      },
      finishNow() {
        // selesaikan semua animasi tertunda seketika
        const rest = queue.splice(0);
        if (anim) finishAnim();
        for (const j of rest) { cur = applyMove(cur, N, j.tok); if (j.focusAfter) focusSet = new Set(j.focusAfter); j.resolve(); }
        if (pendingFocus) { focusSet = new Set(pendingFocus); pendingFocus = null; }
        paint();
      },
      isAnimating() { return !!anim || queue.length > 0; },
      setView(name) { placeCamera(VIEWS[name] || VIEWS.front); },
      setLabels(on) { labelsOn = on; updateLabels(); dirty = true; },
      setAutoRotate(on) { controls.autoRotate = on; },
      setInteractive(on) { controls.enabled = on; },
    };
    api.current.setLabels(labels);
    controls.autoRotate = autoRotate;
    controls.enabled = interactive;
    placeCamera(VIEWS[view] || VIEWS.front);
    paint();
    if (onReady) onReady(api.current);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      queue.length = 0;
      scene.traverse((o) => {
        if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }
      });
      body.dispose(); stickerGeo.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) { /* abaikan */ }
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      api.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  useEffect(() => { if (state && api.current.setState && !api.current.isAnimating()) api.current.setState(state); }, [state]);
  useEffect(() => { if (api.current.setFocus) api.current.setFocus(focus || []); }, [focus]);
  useEffect(() => { if (api.current.setLabels) api.current.setLabels(labels); }, [labels]);
  useEffect(() => { if (api.current.setAutoRotate) api.current.setAutoRotate(autoRotate); }, [autoRotate]);
  useEffect(() => { if (api.current.setView) api.current.setView(view); }, [view]);

  useImperativeHandle(ref, () => ({
    move: (t, d, f) => api.current.move?.(t, d, f),
    setState: (s) => api.current.setState?.(s),
    getState: () => api.current.getState?.(),
    setFocus: (f) => api.current.setFocus?.(f),
    finishNow: () => api.current.finishNow?.(),
    isAnimating: () => api.current.isAnimating?.(),
    setView: (v) => api.current.setView?.(v),
  }), []);

  return <div ref={hostRef} className={'cube-view ' + className} />;
});

export default CubeView;
