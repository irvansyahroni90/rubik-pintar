// Pembuat keadaan kubus untuk materi belajar: kubus "jadi" dengan kuning di atas, putih di bawah, hijau di depan.
// Keping yang tidak dibahas dibuat abu-abu supaya fokus pada keping yang penting.
import { applyMoves, applyMove, solvedState, inversePerm, parseAlg, geometry } from '../core/cube.js';
import { st, pieceStickers } from '../core/pieces.js';
import { OUTER_MOVES } from '../core/solver/search.js';

export const GREY = 6;
export const BASE = Array.from(applyMoves(solvedState(3), 3, ['z2']));

const GROUPS = {
  centers: ['U', 'D', 'F', 'B', 'R', 'L'],
  cross: ['DF', 'DR', 'DB', 'DL'],
  bottomCorners: ['DFR', 'DFL', 'DBR', 'DBL'],
  middle: ['FR', 'FL', 'BR', 'BL'],
  topEdges: ['UF', 'UR', 'UB', 'UL'],
  topCorners: ['UFR', 'UFL', 'UBR', 'UBL'],
};
GROUPS.bottom = [...GROUPS.cross, ...GROUPS.bottomCorners];
GROUPS.f2l = [...GROUPS.bottom, ...GROUPS.middle];
GROUPS.all = [...GROUPS.centers, ...GROUPS.f2l, ...GROUPS.topEdges, ...GROUPS.topCorners];

export function expand(names) {
  const out = [];
  for (const n of names) {
    if (typeof n === 'string' && GROUPS[n]) out.push(...GROUPS[n]);
    else out.push(n);
  }
  return out;
}

// Kubus abu-abu, hanya keping dalam daftar yang berwarna. Entri {piece, only:'U'} = hanya stiker di sisi itu.
export function mask(names, base = BASE) {
  const s = new Array(54).fill(GREY);
  for (const n of expand(names)) {
    if (typeof n === 'string') { for (const i of pieceStickers(3, n)) s[i] = base[i]; } else {
      const i = st(3, n.piece, n.only); s[i] = base[i];
    }
  }
  return s;
}

const pathCache = new Map();
function pathBetween(from, to) {
  const k = from + '>' + to;
  if (pathCache.has(k)) return pathCache.get(k);
  const tos = OUTER_MOVES.map((m) => inversePerm(3, m));
  const prev = new Map([[from, null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (cur === to) break;
    tos.forEach((t, i) => { const n = t[cur]; if (!prev.has(n)) { prev.set(n, [cur, i]); q.push(n); } });
  }
  const path = [];
  let c = to;
  while (prev.get(c)) { const [p, i] = prev.get(c); path.push(OUTER_MOVES[i]); c = p; }
  path.reverse();
  pathCache.set(k, path);
  return path;
}

/**
 * Pindahkan satu keping (posisi asalnya di kubus jadi) ke posisi lain:
 * stiker yang aslinya di sisi `ref` akan menghadap sisi `face` pada posisi `at`.
 */
export function put(state, piece, ref, at, face, base = BASE) {
  const single = new Array(54).fill(GREY);
  for (const i of pieceStickers(3, piece)) single[i] = base[i];
  const moves = pathBetween(st(3, piece, ref), st(3, at, face));
  const moved = applyMoves(single, 3, moves);
  const out = state.slice();
  for (const i of pieceStickers(3, at)) out[i] = moved[i];
  return out;
}

/**
 * def: { ctx: [nama keping berwarna], put: [[keping, ref, posisi, sisi], ...], setup: 'gerakan' }
 */
export function buildState(def) {
  if (def.N && def.N !== 3) return buildStateN(def);
  let s = mask(def.ctx || []);
  for (const p of def.put || []) s = put(s, ...p);
  if (def.onlyYellowTop) {
    // hanya stiker kuning lapisan atas yang ditampilkan (untuk mengenali pola)
    for (const p of ['UF', 'UR', 'UB', 'UL', 'UFR', 'UFL', 'UBR', 'UBL']) for (const i of pieceStickers(3, p)) if (s[i] !== BASE[st(3, 'U', 'U')]) s[i] = GREY;
  }
  if (def.setup) s = Array.from(applyMoves(s, 3, parseAlg(def.setup)));
  return s;
}

export function stickersAt(names) {
  return expand(names).flatMap((n) => pieceStickers(3, n));
}

export function caseMoves(c) {
  return (c.parts || []).flatMap((p) => parseAlg(p.moves));
}

// ---------------- Kubus 4x4 (dan N lain) ----------------

const baseCache = new Map();
// orient 'W' = putih di atas (kubus jadi biasa), 'Y' = kuning di atas, hijau di depan (z2)
export function baseN(N, orient = 'Y') {
  const k = N + orient;
  if (!baseCache.has(k)) {
    const s = solvedState(N);
    baseCache.set(k, Array.from(orient === 'Y' ? applyMoves(s, N, ['z2']) : s));
  }
  return baseCache.get(k);
}

const AXN = { U: [1, 1], D: [1, -1], R: [0, 1], L: [0, -1], F: [2, 1], B: [2, -1] };
const FACE_IDX = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };

// Daftar stiker untuk sebuah grup: 'centers', 'centers:U', 'wings', 'edge:UF', 'wing:UF:+', 'corners',
// 'corner:UFR', 'face:U', 'layer:U', 'f2l' (dua lapis bawah ke bawah), 'all'
export function groupN(N, name) {
  const g = geometry(N);
  const lim = N - 1;
  const out = [];
  const [kind, arg, sub] = name.split(':');
  for (let i = 0; i < g.size; i++) {
    const p = g.pos[i];
    const c = p.map((v) => Math.max(-lim, Math.min(lim, v)));
    const ext = c.map((v) => Math.abs(v) === lim);
    const nExt = ext.filter(Boolean).length;
    const face = g.faceOf[i];
    const at = (f) => { const [a, sg] = AXN[f]; return c[a] === sg * lim; };
    let ok = false;
    switch (kind) {
      case 'all': ok = true; break;
      case 'centers': ok = nExt === 1 && (!arg || face === FACE_IDX[arg]); break;
      case 'wings': ok = nExt === 2; break;
      case 'edge': case 'wing': {
        ok = nExt === 2 && at(arg[0]) && at(arg[1]);
        if (ok && kind === 'wing') {
          const free = 3 - AXN[arg[0]][0] - AXN[arg[1]][0];
          ok = (sub === '+') === (c[free] > 0);
        }
        break;
      }
      case 'corners': ok = nExt === 3; break;
      case 'corner': ok = nExt === 3 && arg.split('').every(at); break;
      case 'face': ok = face === FACE_IDX[arg]; break;
      case 'layer': ok = at(arg); break;
      case 'f2l': ok = c[1] < lim; break;
      default: throw new Error('grup tidak dikenal: ' + name);
    }
    if (ok) out.push(i);
  }
  return out;
}

export function maskN(N, base, groups) {
  const s = new Array(6 * N * N).fill(GREY);
  for (const gname of groups) {
    if (typeof gname === 'object') {
      // { group, color }: hanya stiker grup itu yang warnanya = color
      for (const i of groupN(N, gname.group)) if (base[i] === gname.color) s[i] = base[i];
    } else for (const i of groupN(N, gname)) s[i] = base[i];
  }
  return s;
}

export function trackN(N, stickers, moves) {
  if (!stickers.length) return [];
  let mark = new Uint8Array(6 * N * N);
  stickers.forEach((i) => { mark[i] = 1; });
  for (const t of parseAlg(moves)) mark = applyMove(mark, N, t);
  const out = [];
  mark.forEach((v, i) => { if (v) out.push(i); });
  return out;
}

/** Kasus kubus besar: { N, base:'W'|'Y', ctx:[grup], setup:'gerakan', track:[grup], swap:[[i,j],...] } */
export function buildStateN(def) {
  const N = def.N;
  const base = baseN(N, def.base || 'Y');
  let s = maskN(N, base, def.ctx || ['all']);
  for (const [a, b] of def.swap || []) { const t = s[a]; s[a] = s[b]; s[b] = t; }
  if (def.setup) s = Array.from(applyMoves(s, N, parseAlg(def.setup)));
  return s;
}

export function caseFocus(def) {
  const N = def.N || 3;
  if (def.track) return trackN(N, def.track.flatMap((g) => groupN(N, g)), def.setup || '');
  if (def.focusAt) return def.focusAt.flatMap((g) => groupN(N, g));
  return N === 3 ? stickersAt(def.focus || []) : [];
}
