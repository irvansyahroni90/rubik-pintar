// Mesin kubus NxN berbasis facelet (stiker).
// Urutan sisi: U R F D L B. Indeks stiker = sisi*N*N + baris*N + kolom.
// Orientasi tiap sisi mengikuti "net" standar:
//   U dilihat dari atas (B di atas gambar, F di bawah), D dilihat dari bawah (F di atas),
//   F/R/B/L dilihat dari depan masing-masing dengan U di atas.
// Sumbu 3D: x = kanan (R), y = atas (U), z = depan (F). Koordinat digandakan agar bulat.

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
export const FI = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
export const NORMALS = [
  [0, 1, 0], [1, 0, 0], [0, 0, 1], [0, -1, 0], [-1, 0, 0], [0, 0, -1],
];

// Warna: id 0..5
export const COLORS = ['W', 'Y', 'R', 'O', 'G', 'B'];
export const COLOR_ID = { W: 0, Y: 1, R: 2, O: 3, G: 4, B: 5 };
// Skema standar (U putih, F hijau, R merah, D kuning, L oranye, B biru)
export const DEFAULT_SCHEME = [0, 2, 4, 1, 3, 5]; // urutan U R F D L B

const geoCache = new Map();

function stickerPos(N, f, r, c) {
  switch (f) {
    case 0: return [-(N - 1) + 2 * c, N, -(N - 1) + 2 * r]; // U
    case 1: return [N, (N - 1) - 2 * r, (N - 1) - 2 * c]; // R
    case 2: return [-(N - 1) + 2 * c, (N - 1) - 2 * r, N]; // F
    case 3: return [-(N - 1) + 2 * c, -N, (N - 1) - 2 * r]; // D
    case 4: return [-N, (N - 1) - 2 * r, -(N - 1) + 2 * c]; // L
    case 5: return [(N - 1) - 2 * c, (N - 1) - 2 * r, -N]; // B
    default: throw new Error('face');
  }
}

const key = (p) => p[0] + ',' + p[1] + ',' + p[2];

// Rotasi +90 derajat (kaidah tangan kanan) mengelilingi sumbu.
export function rot90(p, axis) {
  const [x, y, z] = p;
  if (axis === 0) return [x, -z, y];
  if (axis === 1) return [z, y, -x];
  return [-y, x, z];
}
export function rotQ(p, axis, q) {
  let r = p;
  for (let i = 0; i < ((q % 4) + 4) % 4; i++) r = rot90(r, axis);
  return r;
}

export function geometry(N) {
  if (geoCache.has(N)) return geoCache.get(N);
  const size = 6 * N * N;
  const pos = new Array(size);
  const index = new Map();
  const faceOf = new Uint8Array(size);
  for (let f = 0; f < 6; f++) {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = f * N * N + r * N + c;
        const p = stickerPos(N, f, r, c);
        pos[i] = p;
        faceOf[i] = f;
        index.set(key(p), i);
      }
    }
  }
  const g = { N, size, pos, index, faceOf, perms: new Map() };
  geoCache.set(N, g);
  return g;
}

export function stickerIndex(N, p) {
  const i = geometry(N).index.get(key(p));
  if (i === undefined) throw new Error('posisi stiker tidak valid ' + key(p));
  return i;
}

// Definisi gerakan sisi: sumbu, sisi positif?, jumlah +90 untuk searah jarum jam
const FACE_MOVE = {
  R: { axis: 0, pos: true, cw: 3 },
  L: { axis: 0, pos: false, cw: 1 },
  U: { axis: 1, pos: true, cw: 3 },
  D: { axis: 1, pos: false, cw: 1 },
  F: { axis: 2, pos: true, cw: 3 },
  B: { axis: 2, pos: false, cw: 1 },
};
const SLICE_LIKE = { M: 'L', E: 'D', S: 'F' };
const ROT_LIKE = { x: 'R', y: 'U', z: 'F' };

const TOKEN_RE = /^(\d+)?([RLUDFBrludfbMESxyz])(w)?(2'|2|'|)$/;

// Mengurai satu token menjadi {axis, layers[], q, face, kind}
export function parseToken(tok, N) {
  const m = TOKEN_RE.exec(tok);
  if (!m) throw new Error('Notasi tidak dikenal: ' + tok);
  const [, numStr, letter, w, mod] = m;
  const times = mod === "'" ? 3 : mod === '' ? 1 : 2;
  let baseFace;
  let depthFrom = 1;
  let depthTo = 1;
  let kind = 'face';
  if (ROT_LIKE[letter]) {
    baseFace = ROT_LIKE[letter];
    depthFrom = 1; depthTo = N; kind = 'rotation';
  } else if (SLICE_LIKE[letter]) {
    baseFace = SLICE_LIKE[letter];
    if (N < 3) throw new Error('Gerakan ' + letter + ' butuh kubus 3x3 ke atas');
    depthFrom = 2; depthTo = N - 1; kind = 'slice';
  } else if (letter === letter.toLowerCase()) {
    // huruf kecil: semua lapisan kecuali lapisan terjauh (3x3: 2 lapis)
    baseFace = letter.toUpperCase();
    if (numStr || w) throw new Error('Notasi tidak dikenal: ' + tok);
    depthFrom = 1; depthTo = Math.max(1, N - 1); kind = 'wide';
  } else {
    baseFace = letter;
    const n = numStr ? parseInt(numStr, 10) : (w ? 2 : 1);
    if (w) { depthFrom = 1; depthTo = n; kind = n >= N ? 'rotation' : 'wide'; } else { depthFrom = n; depthTo = n; kind = n === 1 ? 'face' : 'inner'; }
  }
  if (depthTo > N || depthFrom < 1) throw new Error('Lapisan di luar ukuran kubus: ' + tok);
  const fm = FACE_MOVE[baseFace];
  const layers = [];
  for (let d = depthFrom; d <= depthTo; d++) layers.push(fm.pos ? N - d : d - 1);
  const q = (fm.cw * times) % 4;
  return { axis: fm.axis, layers, q, face: baseFace, kind, times };
}

// Permutasi "from": next[j] = cur[from[j]]
export function movePerm(N, tok) {
  const g = geometry(N);
  const cached = g.perms.get(tok);
  if (cached) return cached;
  const { axis, layers, q } = parseToken(tok, N);
  const layerSet = new Set(layers);
  const from = new Uint16Array(g.size);
  for (let i = 0; i < g.size; i++) from[i] = i;
  const lim = N - 1;
  for (let i = 0; i < g.size; i++) {
    const p = g.pos[i];
    const v = Math.max(-lim, Math.min(lim, p[axis]));
    const layer = (v + lim) / 2;
    if (!layerSet.has(layer)) continue;
    const np = rotQ(p, axis, q);
    const dest = g.index.get(key(np));
    from[dest] = i;
  }
  g.perms.set(tok, from);
  return from;
}

export function parseAlg(alg) {
  if (Array.isArray(alg)) return alg.slice();
  return alg
    .replace(/[()[\],]/g, ' ')
    .replace(/’/g, "'")
    .split(/\s+/)
    .filter(Boolean);
}

export function applyMove(state, N, tok, out) {
  const from = movePerm(N, tok);
  const res = out || new Uint8Array(state.length);
  for (let j = 0; j < from.length; j++) res[j] = state[from[j]];
  return res;
}

export function applyMoves(state, N, moves) {
  let s = Uint8Array.from(state);
  let t = new Uint8Array(s.length);
  for (const tok of parseAlg(moves)) {
    applyMove(s, N, tok, t);
    const tmp = s; s = t; t = tmp;
  }
  return s;
}

// Lacak posisi satu stiker melewati sederet gerakan
export function trackSticker(N, idx, moves) {
  let cur = idx;
  for (const tok of parseAlg(moves)) cur = inversePerm(N, tok)[cur];
  return cur;
}

const invCache = new Map();
export function inversePerm(N, tok) {
  const k = N + ':' + tok;
  if (invCache.has(k)) return invCache.get(k);
  const from = movePerm(N, tok);
  const to = new Uint16Array(from.length);
  for (let j = 0; j < from.length; j++) to[from[j]] = j;
  invCache.set(k, to);
  return to;
}

export function solvedState(N, scheme = DEFAULT_SCHEME) {
  const s = new Uint8Array(6 * N * N);
  for (let f = 0; f < 6; f++) s.fill(scheme[f], f * N * N, (f + 1) * N * N);
  return s;
}

export function isSolved(state, N) {
  const n2 = N * N;
  for (let f = 0; f < 6; f++) {
    const c = state[f * n2];
    for (let i = 1; i < n2; i++) if (state[f * n2 + i] !== c) return false;
  }
  return true;
}

export function invertToken(t) {
  if (t.endsWith("2'")) return t.slice(0, -1);
  if (t.endsWith('2')) return t;
  if (t.endsWith("'")) return t.slice(0, -1);
  return t + "'";
}

export function invertAlg(moves) {
  return parseAlg(moves).reverse().map(invertToken);
}

function splitTok(t) {
  if (t.endsWith("2'")) return [t.slice(0, -2), 2];
  if (t.endsWith('2')) return [t.slice(0, -1), 2];
  if (t.endsWith("'")) return [t.slice(0, -1), 3];
  return [t, 1];
}
function joinTok(base, n) {
  n = ((n % 4) + 4) % 4;
  if (n === 0) return null;
  return base + (n === 1 ? '' : n === 2 ? '2' : "'");
}

// Gabungkan gerakan berurutan yang sama (U U -> U2, U U' -> hilang)
export function simplify(moves) {
  const out = [];
  for (const t of parseAlg(moves)) {
    const [b, n] = splitTok(t);
    if (out.length) {
      const [pb, pn] = splitTok(out[out.length - 1]);
      if (pb === b) {
        out.pop();
        const j = joinTok(b, pn + n);
        if (j) out.push(j);
        continue;
      }
    }
    out.push(t);
  }
  return out;
}

export function countMoves(moves) {
  return parseAlg(moves).filter((t) => !/^[xyz]/.test(t)).length;
}

// Scramble acak standar
export function randomScramble(N, len, rng = Math.random) {
  const len2 = len || ({ 2: 11, 3: 22, 4: 42, 5: 60 }[N] || 25);
  const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
  const axisOf = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 };
  const mods = ['', "'", '2'];
  const out = [];
  let lastAxis = -1;
  let usedOnAxis = new Set();
  while (out.length < len2) {
    const f = faces[Math.floor(rng() * 6)];
    let prefix = '';
    let suffix = '';
    if (N >= 4) {
      const maxDepth = Math.floor(N / 2);
      const depth = 1 + Math.floor(rng() * maxDepth);
      if (depth >= 2) {
        if (depth === 2) suffix = 'w'; else { prefix = String(depth); suffix = 'w'; }
      }
    }
    if (N === 2 && (f === 'L' || f === 'D' || f === 'B')) continue;
    const famKey = prefix + f + suffix;
    const ax = axisOf[f];
    if (ax !== lastAxis) { usedOnAxis = new Set(); lastAxis = ax; }
    if (usedOnAxis.has(famKey)) continue;
    usedOnAxis.add(famKey);
    out.push(prefix + f + suffix + mods[Math.floor(rng() * 3)]);
  }
  return out;
}

// Semua token gerakan dasar yang didukung (untuk tombol)
export function basicMoves(N) {
  const base = ['R', 'L', 'U', 'D', 'F', 'B'];
  const res = [];
  for (const b of base) res.push(b, b + "'", b + '2');
  return res;
}
