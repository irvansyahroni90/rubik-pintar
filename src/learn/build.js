// Pembuat keadaan kubus untuk materi belajar: kubus "jadi" dengan kuning di atas, putih di bawah, hijau di depan.
// Keping yang tidak dibahas dibuat abu-abu supaya fokus pada keping yang penting.
import { applyMoves, solvedState, inversePerm, parseAlg } from '../core/cube.js';
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
