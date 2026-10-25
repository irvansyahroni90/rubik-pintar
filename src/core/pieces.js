// Akses "keping" (pojok, edge, center) memakai nama posisi seperti 'UFR', 'UF', 'U'.
// Bekerja untuk N >= 2 (edge/center hanya N >= 3). Untuk kubus besar, edge = keping
// tengah (N ganjil) atau wing pertama (N genap); center = keping tengah/representatif.
import { FI, NORMALS, stickerIndex, geometry } from './cube.js';

const AXIS_OF = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 };
const SIGN_OF = { U: 1, D: -1, R: 1, L: -1, F: 1, B: -1 };

export const CORNERS = ['UFR', 'UFL', 'UBL', 'UBR', 'DFR', 'DFL', 'DBL', 'DBR'];
export const EDGES = ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BR', 'BL', 'DF', 'DR', 'DB', 'DL'];
export const SIDES = ['F', 'R', 'B', 'L']; // urutan searah jarum jam dilihat dari atas? (F->R->B->L)

const cache = new Map();

// indeks stiker posisi `name` pada sisi `face`
export function st(N, name, face) {
  const k = N + name + face;
  let v = cache.get(k);
  if (v !== undefined) return v;
  const mid = Math.floor((N - 1) / 2);
  const cub = [0, 0, 0];
  const used = [false, false, false];
  for (const ch of name) {
    const a = AXIS_OF[ch];
    used[a] = true;
    cub[a] = SIGN_OF[ch] > 0 ? N - 1 : 0;
  }
  for (let a = 0; a < 3; a++) if (!used[a]) cub[a] = mid;
  // koordinat ganda pusat kubus kecil
  const p = cub.map((i) => 2 * i - (N - 1));
  const fa = AXIS_OF[face];
  p[fa] = SIGN_OF[face] * N;
  v = stickerIndex(N, p);
  cache.set(k, v);
  return v;
}

export function pieceStickers(N, name) {
  return name.split('').map((f) => st(N, name, f));
}

// Semua stiker satu "blok" (edge kubus besar = seluruh keping sepanjang edge)
export function blockStickers(N, name) {
  if (N <= 3 || name.length !== 2) return pieceStickers(N, name);
  const out = [];
  const a1 = AXIS_OF[name[0]]; const a2 = AXIS_OF[name[1]];
  const free = 3 - a1 - a2;
  for (let i = 1; i < N - 1; i++) {
    for (const f of name) {
      const p = [0, 0, 0];
      p[a1] = SIGN_OF[name[0]] * (N - 1); p[a2] = SIGN_OF[name[1]] * (N - 1); p[free] = 2 * i - (N - 1);
      p[AXIS_OF[f]] = SIGN_OF[f] * N;
      out.push(stickerIndex(N, p));
    }
  }
  return out;
}

export function colorsAt(state, N, name) {
  return name.split('').map((f) => state[st(N, name, f)]);
}

export function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const s = [...a].sort().join(',');
  return s === [...b].sort().join(',');
}

// Urutan U-layer saat diputar U searah jarum jam: posisi i -> i+1
export const U_EDGE_CYCLE = ['UF', 'UL', 'UB', 'UR'];
export const U_CORNER_CYCLE = ['UFR', 'UFL', 'UBL', 'UBR'];

export function uTurnsTo(cycle, from, to) {
  const a = cycle.indexOf(from);
  const b = cycle.indexOf(to);
  return (((b - a) % 4) + 4) % 4;
}
export function uToken(k, face = 'U') {
  k = ((k % 4) + 4) % 4;
  return k === 0 ? [] : k === 1 ? [face] : k === 2 ? [face + '2'] : [face + "'"];
}
export function yToken(k) { return uToken(k, 'y'); }

// Info geometri tambahan untuk kubus N: daftar kubus-kecil permukaan beserta stikernya
const cubieCache = new Map();
export function cubies(N) {
  if (cubieCache.has(N)) return cubieCache.get(N);
  const g = geometry(N);
  const map = new Map();
  const lim = N - 1;
  for (let i = 0; i < g.size; i++) {
    const p = g.pos[i];
    const c = p.map((v) => Math.max(-lim, Math.min(lim, v)));
    const k = c.join(',');
    if (!map.has(k)) map.set(k, { pos: c, stickers: [] });
    map.get(k).stickers.push(i);
  }
  const list = [...map.values()];
  const byIdx = new Int32Array(g.size);
  list.forEach((cb, ci) => cb.stickers.forEach((s) => { byIdx[s] = ci; }));
  const res = { list, byIdx };
  cubieCache.set(N, res);
  return res;
}

export function faceNormal(face) { return NORMALS[FI[face]]; }
