// Solver 2x2: Pemula (lapisan) dan Ortega
import { parseAlg, inversePerm } from '../cube.js';
import { OUTER_MOVES } from './search.js';
import { uToken, sameSet } from '../pieces.js';
import { stageFirstCorners, stageTopCornersPos, stageTopCornersTwist, peek, uText } from './lbl.js';
import { ce } from './ctx.js';
import { ORTEGA_OLL, ORTEGA_PBL } from './algs.js';

export function solve2LBL(ctx) {
  stageFirstCorners(ctx);
  stageTopCornersPos(ctx, { free: true });
  stageTopCornersTwist(ctx);
}

const U_POS = ['UFR', 'UFL', 'UBL', 'UBR'];
const D_POS = ['DFR', 'DFL', 'DBL', 'DBR'];

function faceDone(ctx, face, color) {
  const n2 = 4; const base = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 }[face] * n2;
  for (let i = 0; i < 4; i++) if (ctx.state[base + i] !== color) return false;
  return true;
}
function solved2(ctx) {
  for (const p of [...U_POS, ...D_POS]) for (const f of p) if (ctx.c(p, f) !== ctx.center(f)) return false;
  return true;
}

// Tabel BFS: himpunan posisi stiker berwarna dasar -> jarak ke "sisi bawah penuh"
let FT = null;
function faceTable() {
  if (FT) return FT;
  const to = OUTER_MOVES.map((m) => inversePerm(2, m));
  const mv = (mask, t) => { let r = 0; for (let b = 0; b < 24; b++) if (mask & (1 << b)) r |= 1 << t[b]; return r; };
  const target = (1 << 12) | (1 << 13) | (1 << 14) | (1 << 15);
  const dist = new Map([[target, 0]]);
  let frontier = [target];
  while (frontier.length) {
    const nf = [];
    for (const m of frontier) {
      const d = dist.get(m);
      for (const t of to) { const n = mv(m, t); if (!dist.has(n)) { dist.set(n, d + 1); nf.push(n); } }
    }
    frontier = nf;
  }
  FT = { to, mv, dist };
  return FT;
}
function faceSolve(state, base) {
  const { to, mv, dist } = faceTable();
  let mask = 0;
  for (let i = 0; i < 24; i++) if (state[i] === base) mask |= 1 << i;
  let d = dist.get(mask);
  if (d === undefined) throw new Error('Ortega face gagal');
  const out = [];
  while (d > 0) {
    let moved = false;
    for (let i = 0; i < to.length; i++) {
      const n = mv(mask, to[i]);
      if (dist.get(n) === d - 1) { out.push(OUTER_MOVES[i]); mask = n; d--; moved = true; break; }
    }
    if (!moved) throw new Error('Ortega face gagal');
  }
  return out;
}

export function solve2Ortega(ctx) {
  const base = ctx.center('D');
  const top = ctx.center('U');
  // 1. Face
  ctx.stage('face', 'Ortega 1 · Satu Sisi',
    `Buat satu sisi ${ce(base)} di bawah. Warna samping belum perlu cocok — cukup sisinya saja.`,
    ['Bangun 2 keping dulu, lalu sisipkan sisanya.', 'Latih secara intuitif: gerakan R, U, F sudah cukup.']);
  if (!faceDone(ctx, 'D', base)) {
    const sol = faceSolve(ctx.state, base);
    ctx.step(`Sisi ${ce(base)}`, `${sol.length} gerakan (optimal) untuk membentuk sisi ${ce(base)} di bawah.`, sol);
  }
  // 2. OLL
  ctx.stage('oll', 'Ortega 2 · OLL',
    `Buat sisi atas ${ce(top)} dengan satu dari 7 rumus.`,
    ['Rumusnya sama dengan OLL sudut di CFOP 3x3 — sekali belajar, dipakai dua kali!']);
  if (!faceDone(ctx, 'U', top)) {
    let best = null;
    for (let k = 0; k < 4; k++) for (const a of ORTEGA_OLL) {
      const mv = [...uToken(k), ...parseAlg(a.alg)];
      const t = peek(ctx, mv);
      if (faceDone(t, 'U', top) && faceDone(t, 'D', base) && (!best || mv.length < best.mv.length)) best = { mv, a, k };
    }
    if (!best) throw new Error('Ortega OLL gagal');
    ctx.step(`OLL: ${best.a.name}`, `${uText(best.k)}Rumus ${best.a.name}: ${best.a.alg}`, best.mv, { alg: best.a.alg });
  }
  // 3. PBL
  ctx.stage('pbl', 'Ortega 3 · PBL',
    'Tukar posisi sudut di lapisan atas & bawah sekaligus, lalu putar U/D untuk merapikan.',
    ['Cek "lampu depan": dua stiker sama warna di satu sisi = lapisan itu tinggal tukar sebelah.', 'Tidak ada lampu di sisi mana pun = tukar diagonal.']);
  const AUF = [[], ['U'], ['U2'], ["U'"]];
  const ADF = [[], ['D'], ['D2'], ["D'"]];
  let best = null;
  for (const a of AUF) for (const d of ADF) {
    const pre = [...a, ...d];
    if (solved2(peek(ctx, pre))) { if (!best || pre.length < best.mv.length) best = { mv: pre, a: null }; }
  }
  if (!best) {
    for (const a of AUF) for (const d of ADF) for (const alg of ORTEGA_PBL) for (const a2 of AUF) for (const d2 of ADF) {
      const mv = [...a, ...d, ...parseAlg(alg.alg), ...a2, ...d2];
      if (best && mv.length >= best.mv.length) continue;
      if (solved2(peek(ctx, mv))) best = { mv, a: alg };
    }
  }
  if (!best) {
    // cadangan 2 rumus
    outer: for (const a of AUF) for (const d of ADF) for (const al1 of ORTEGA_PBL) for (const a2 of AUF) for (const d2 of ADF) for (const al2 of ORTEGA_PBL.slice(0, 2)) {
      const mv0 = [...a, ...d, ...parseAlg(al1.alg), ...a2, ...d2, ...parseAlg(al2.alg)];
      for (const a3 of AUF) for (const d3 of ADF) {
        const mv = [...mv0, ...a3, ...d3];
        if (solved2(peek(ctx, mv))) { best = { mv, a: al1, a2: al2 }; break outer; }
      }
    }
  }
  if (!best) throw new Error('Ortega PBL gagal');
  if (best.mv.length) {
    ctx.step(best.a ? `PBL: ${best.a.name}` : 'Rapikan', best.a ? `Rumus: ${best.a.alg}${best.a2 ? ' lalu ' + best.a2.alg : ''}. Gunakan putaran U/D sebelum & sesudahnya untuk menyelaraskan.` : 'Cukup putar U/D untuk merapikan. Selesai! 🎉', best.mv, { alg: best.a ? best.a.alg : null });
  }
}

export { sameSet };
