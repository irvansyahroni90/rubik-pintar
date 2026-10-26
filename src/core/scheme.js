// Skema warna, orientasi pegangan, dan validasi hasil scan
import { NORMALS, FI, FACES, applyMoves, solvedState, stickerIndex } from './cube.js';
import { st, CORNERS, EDGES, colorsAt } from './pieces.js';

const COLOR_NAME = ['putih', 'kuning', 'merah', 'oranye', 'hijau', 'biru'];

function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

// Urutan sisi sudut searah jarum jam (dilihat dari luar), dimulai dari U/D
const CW = {};
for (const c of CORNERS) {
  const fs = c.split('');
  const d = [0, 0, 0];
  fs.forEach((f) => { const n = NORMALS[FI[f]]; d[0] += n[0]; d[1] += n[1]; d[2] += n[2]; });
  const ud = fs.find((f) => f === 'U' || f === 'D');
  const rest = fs.filter((f) => f !== ud);
  let order = [ud, rest[0], rest[1]];
  const a = NORMALS[FI[order[0]]]; const b = NORMALS[FI[order[1]]];
  if (dot(cross(a, b), d) > 0) order = [ud, rest[1], rest[0]];
  CW[c] = order;
}
export const CORNER_CW = CW;

export function cornerCycles(state, N) {
  return CORNERS.map((c) => CW[c].map((f) => state[st(N, c, f)]));
}

export function oppositesFromCorners(state, N) {
  const adj = Array.from({ length: 6 }, () => new Set());
  for (const cyc of cornerCycles(state, N)) {
    for (const x of cyc) for (const y of cyc) if (x !== y) adj[x].add(y);
  }
  const opp = new Array(6).fill(-1);
  for (let a = 0; a < 6; a++) {
    const cands = [];
    for (let b = 0; b < 6; b++) if (a !== b && !adj[a].has(b)) cands.push(b);
    if (cands.length === 1) opp[a] = cands[0];
  }
  return opp;
}

// Skema (warna per sisi U R F D L B) dari warna atas & depan, memakai kiralitas sudut
export function schemeFrom(state, N, top, front) {
  const cycles = cornerCycles(state, N);
  let right = -1; let left = -1;
  for (const cyc of cycles) {
    if (!cyc.includes(top) || !cyc.includes(front)) continue;
    const i = cyc.indexOf(top);
    const r = [cyc[i], cyc[(i + 1) % 3], cyc[(i + 2) % 3]];
    if (r[2] === front) right = r[1];
    if (r[1] === front) left = r[2];
  }
  const opp = oppositesFromCorners(state, N);
  if (right < 0 || left < 0) throw new Error(`Warna ${COLOR_NAME[top]} dan ${COLOR_NAME[front]} tidak bisa bersebelahan.`);
  const scheme = [top, right, front, opp[top], left, opp[front]];
  if (new Set(scheme).size !== 6 || scheme.some((x) => x < 0)) throw new Error('Skema warna tidak konsisten — cek hasil scan.');
  return scheme;
}

// Warna tengah untuk kubus ganjil
export function centerColors(state, N) {
  const m = Math.floor(N / 2);
  return FACES.map((f, i) => state[i * N * N + m * N + m]);
}

const ROTS = ['', 'x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2'];
// Rotasi seluruh kubus (ganjil) agar warna top di atas dan front di depan
export function orientationMoves(state, N, top, front) {
  const seqs = [[]];
  for (const a of ROTS) if (a) seqs.push([a]);
  for (const a of ROTS) for (const b of ROTS) if (a && b && a[0] !== b[0]) seqs.push([a, b]);
  for (const s of seqs) {
    const t = applyMoves(state, N, s);
    const cc = centerColors(t, N);
    if (cc[0] === top && cc[2] === front) return s;
  }
  throw new Error('Kombinasi atas & depan tidak mungkin (harus bersebelahan).');
}

// ---------------- Validasi ----------------
function permParity(arr) {
  const seen = new Array(arr.length).fill(false);
  let p = 0;
  for (let i = 0; i < arr.length; i++) {
    if (seen[i]) continue;
    let j = i; let len = 0;
    while (!seen[j]) { seen[j] = true; j = arr[j]; len++; }
    p += len - 1;
  }
  return p % 2;
}

// ---------- Wing (keping pinggir kubus 4x4/5x5) ----------
// Setiap wing punya "kiralitas" tetap, jadi pasangan warnanya bisa diurutkan secara unik.
const AX = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 };
const SG = { U: 1, D: -1, R: 1, L: -1, F: 1, B: -1 };
const wingCache = new Map();
function wingSlots(N) {
  if (wingCache.has(N)) return wingCache.get(N);
  const out = [];
  const mid = N % 2 === 1 ? (N - 1) / 2 : -1;
  for (const e of EDGES) {
    const a1 = AX[e[0]]; const a2 = AX[e[1]];
    const free = 3 - a1 - a2;
    const n1 = NORMALS[FI[e[0]]]; const n2 = NORMALS[FI[e[1]]];
    const cr = cross(n1, n2);
    for (let i = 1; i < N - 1; i++) {
      if (i === mid) continue;
      const p = [0, 0, 0];
      p[a1] = SG[e[0]] * (N - 1); p[a2] = SG[e[1]] * (N - 1); p[free] = 2 * i - (N - 1);
      const s1 = [...p]; s1[a1] = SG[e[0]] * N;
      const s2 = [...p]; s2[a2] = SG[e[1]] * N;
      const off = [0, 0, 0]; off[free] = Math.sign(p[free]);
      const pos = dot(cr, off) > 0;
      const i1 = stickerIndex(N, s1); const i2 = stickerIndex(N, s2);
      out.push({ edge: e, first: pos ? i1 : i2, second: pos ? i2 : i1 });
    }
  }
  wingCache.set(N, out);
  return out;
}

// Orbit center (x-center, t-center, dst.) — tiap warna harus punya jumlah sama di tiap orbit
function centerOrbits(N) {
  const orbits = new Map();
  const lim = N - 1;
  for (let r = 1; r < lim; r++) {
    for (let c = 1; c < lim; c++) {
      const a = Math.min(r, lim - r, c, lim - c); const b = Math.max(Math.min(r, lim - r), Math.min(c, lim - c));
      const k = a + ',' + b;
      if (N % 2 === 1 && r === lim / 2 && c === lim / 2) continue;
      if (!orbits.has(k)) orbits.set(k, []);
      orbits.get(k).push(r * N + c);
    }
  }
  return [...orbits.values()];
}

export function validate(state, N) {
  const errors = [];
  const counts = new Array(6).fill(0);
  for (const c of state) if (c < 6) counts[c]++; else errors.push('Ada stiker yang belum diisi warnanya.');
  if (errors.length) return { ok: false, errors: [...new Set(errors)] };
  const need = N * N;
  counts.forEach((n, c) => { if (n !== need) errors.push(`Warna ${COLOR_NAME[c]} ada ${n} stiker (seharusnya ${need}).`); });
  if (errors.length) return { ok: false, errors };

  let scheme;
  if (N % 2 === 1) {
    scheme = centerColors(state, N);
    if (new Set(scheme).size !== 6) return { ok: false, errors: ['Warna tengah (center) ada yang sama. Cek lagi stiker tengah tiap sisi.'] };
  } else {
    const opp = oppositesFromCorners(state, N);
    if (opp.some((x) => x < 0)) return { ok: false, errors: ['Kombinasi warna sudut tidak wajar — ada sudut yang salah baca.'] };
    // skema acuan bebas: pakai warna atas = warna stiker U sudut pertama
    const cyc = cornerCycles(state, N)[0];
    try { scheme = schemeFrom(state, N, cyc[0], cyc[2]); } catch (e) {
      return { ok: false, errors: ['Kombinasi warna sudut tidak wajar — ada sudut yang salah baca atau sisi yang terputar.'] };
    }
  }
  // Sudut
  const solvedRef = solvedState(3, scheme);
  const refCorners = CORNERS.map((c) => CW[c].map((f) => solvedRef[st(3, c, f)]));
  const keyOf = (cyc) => [...cyc].sort().join(',');
  const refKey = refCorners.map(keyOf);
  const perm = []; let twist = 0; const bad = [];
  const seen = new Set();
  cornerCycles(state, N).forEach((cyc, i) => {
    const k = keyOf(cyc);
    const j = refKey.indexOf(k);
    if (j < 0 || seen.has(j)) { bad.push(CORNERS[i]); return; }
    seen.add(j);
    // cek kiralitas
    const ref = refCorners[j];
    const o = cyc.indexOf(ref[0]);
    const rot = [cyc[o], cyc[(o + 1) % 3], cyc[(o + 2) % 3]];
    if (rot[1] !== ref[1]) { bad.push(CORNERS[i]); return; }
    perm[i] = j;
    twist += o;
  });
  if (bad.length) errors.push(`Sudut tidak valid di posisi ${bad.join(', ')} — kemungkinan ada stiker yang salah warna.`);
  else if (twist % 3 !== 0) errors.push('Ada satu sudut yang terpelintir (twist). Cek lagi warna stiker sudut — atau sudut pernah dicopot/dipasang terbalik.');

  if (N >= 4) {
    // Wing: pasangan warna berurutan harus sama persis dengan kubus jadi
    const ref = solvedState(N, scheme);
    const key = (s, w) => s[w.first] + '>' + s[w.second];
    const want = new Map();
    for (const w of wingSlots(N)) { const k = key(ref, w); want.set(k, (want.get(k) || 0) + 1); }
    const badW = new Set();
    for (const w of wingSlots(N)) {
      const k = key(state, w);
      const n = want.get(k) || 0;
      if (n <= 0) badW.add(w.edge); else want.set(k, n - 1);
    }
    if (badW.size) errors.push(`Keping pinggir (wing) tidak cocok di ${[...badW].join(', ')} — kemungkinan ada sisi yang terputar atau stiker salah warna.`);
    // Center: tiap orbit menampung jumlah warna yang sama
    const n2 = N * N;
    for (const orbit of centerOrbits(N)) {
      const cnt = new Array(6).fill(0);
      for (let f = 0; f < 6; f++) for (const i of orbit) cnt[state[f * n2 + i]]++;
      if (cnt.some((x) => x !== orbit.length)) { errors.push('Jumlah keping center tiap warna tidak pas — cek lagi stiker bagian tengah tiap sisi.'); break; }
    }
  }

  if (N % 2 === 1 && !bad.length) {
    // Edge tengah (3x3 / midge 5x5)
    const refEdges = EDGES.map((e) => e.split('').map((f) => solvedRef[st(3, e, f)]));
    const eperm = []; let flip = 0; const ebad = []; const eseen = new Set();
    EDGES.forEach((e, i) => {
      const cols = colorsAt(state, N, e);
      const j = refEdges.findIndex((r) => (r[0] === cols[0] && r[1] === cols[1]) || (r[0] === cols[1] && r[1] === cols[0]));
      if (j < 0 || eseen.has(j)) { ebad.push(e); return; }
      eseen.add(j); eperm[i] = j;
      flip += refEdges[j][0] === cols[0] ? 0 : 1;
    });
    if (ebad.length) errors.push(`Edge tidak valid di posisi ${ebad.join(', ')} — kemungkinan ada stiker yang salah warna.`);
    else {
      // orientasi edge: hitung relatif terhadap U/D-F/B seperti biasa
      let flip2 = 0;
      EDGES.forEach((e, i) => {
        const cols = colorsAt(state, N, e);
        const ref = refEdges[eperm[i]];
        // stiker "utama" referensi ada di sisi pertama nama edge target
        const primaryColor = ref[0];
        const at = cols.indexOf(primaryColor);
        flip2 += at;
      });
      void flip;
      if (flip2 % 2 !== 0) errors.push('Ada satu edge yang terbalik (flip). Cek lagi stiker edge.');
      if (permParity(perm) !== permParity(eperm)) errors.push('Ada dua keping yang tertukar (parity). Biasanya karena salah baca dua stiker — cek lagi.');
    }
  }
  return { ok: errors.length === 0, errors, scheme };
}

// ---------- Putar susunan satu sisi ----------
// dir 1 = searah jarum jam (seperti dilihat di layar), -1 = berlawanan
export function rotateFace(state, N, face, dir = 1) {
  const n2 = N * N;
  const out = Array.from(state);
  const base = face * n2;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const src = dir > 0 ? (N - 1 - c) * N + r : c * N + (N - 1 - r);
      out[base + r * N + c] = state[base + src];
    }
  }
  return out;
}

function rotateFaceTimes(state, N, face, k) {
  let s = state;
  for (let i = 0; i < k; i++) s = rotateFace(s, N, face, 1);
  return s;
}

/**
 * Cari sisi yang kemungkinan terfoto terputar. Mengembalikan
 * { state, fixes: [{face, turns}] } atau null bila tidak ada perbaikan yang valid.
 */
export function findRotationFix(state, N) {
  const n2 = N * N;
  const counts = new Array(7).fill(0);
  for (const c of state) counts[c]++;
  if (counts[6] || counts.slice(0, 6).some((x) => x !== n2)) return null;
  if (validate(state, N).ok) return null;
  // Sisi yang seragam tidak perlu dicoba
  const faces = [0, 1, 2, 3, 4, 5].filter((f) => {
    const v = state[f * n2];
    for (let i = 1; i < n2; i++) if (state[f * n2 + i] !== v) return true;
    return false;
  });
  // urutkan: atas & bawah dulu (paling sering salah)
  faces.sort((a, b) => (a === 0 || a === 3 ? 0 : 1) - (b === 0 || b === 3 ? 0 : 1));
  const combos = (arr, k) => {
    if (k === 0) return [[]];
    const out = [];
    arr.forEach((x, i) => { for (const rest of combos(arr.slice(i + 1), k - 1)) out.push([x, ...rest]); });
    return out;
  };
  for (let k = 1; k <= faces.length; k++) {
    for (const set of combos(faces, k)) {
      const total = 3 ** k;
      for (let m = 0; m < total; m++) {
        let s = state; let mm = m; const fixes = [];
        for (const f of set) { const t = (mm % 3) + 1; mm = Math.floor(mm / 3); s = rotateFaceTimes(s, N, f, t); fixes.push({ face: f, turns: t }); }
        if (validate(s, N).ok) return { state: s, fixes };
      }
    }
  }
  return null;
}
