// Skema warna, orientasi pegangan, dan validasi hasil scan
import { NORMALS, FI, FACES, applyMoves, solvedState } from './cube.js';
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
    scheme = schemeFrom(state, N, cyc[0], cyc[2]);
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
