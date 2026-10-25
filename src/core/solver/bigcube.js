// Kubus besar (4x4, 5x5): metode Reduksi = Center -> Pairing Edge -> tahap 3x3 (+ parity)
import { geometry, movePerm, inversePerm, parseAlg, parseToken, invertAlg, invertToken, stickerIndex, simplify } from '../cube.js';
import { PARITY } from './algs.js';
import { ce, cn } from './ctx.js';
import { U_EDGES, U_SLOTS, peek } from './lbl.js';
import { sameSet, uToken } from '../pieces.js';

const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
const FACE_ID = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const MODS = ['', "'", '2'];
const OUTER = ['U', 'D', 'R', 'L', 'F', 'B'].flatMap((f) => MODS.map((m) => f + m));

// ---------------- CENTER ----------------
const cCache = new Map();
function centerInfo(N) {
  if (cCache.has(N)) return cCache.get(N);
  const n2 = N * N;
  const idx = []; const face = []; const fixed = [];
  const mid = (N - 1) / 2;
  for (let f = 0; f < 6; f++) for (let r = 1; r < N - 1; r++) for (let c = 1; c < N - 1; c++) {
    idx.push(f * n2 + r * N + c); face.push(f); fixed.push(N % 2 === 1 && r === mid && c === mid);
  }
  const pos = new Map(idx.map((v, i) => [v, i]));
  const moves = [...OUTER];
  for (const f of ['U', 'D', 'R', 'L', 'F', 'B']) for (const m of MODS) moves.push('2' + f + m);
  if (N === 5) for (const f of ['R', 'U', 'F']) for (const m of MODS) moves.push('3' + f + m);
  const cperm = moves.map((t) => { const from = movePerm(N, t); return Int16Array.from(idx.map((g) => pos.get(from[g]))); });
  const fam = moves.map((t) => { const p = parseToken(t, N); return { axis: p.axis, fam: p.axis + ':' + p.layers.join(','), minL: Math.min(...p.layers) }; });
  const info = { idx, face, fixed, pos, moves, cperm, fam, cycles: null, setups: null };
  cCache.set(N, info);
  return info;
}

function compose(perms, len) {
  let from = null;
  for (const p of perms) {
    if (!from) { from = Int16Array.from(p); continue; }
    const nf = new Int16Array(len);
    for (let j = 0; j < len; j++) nf[j] = from[p[j]];
    from = nf;
  }
  return from || Int16Array.from({ length: len }, (_, i) => i);
}

function buildCycles(N) {
  const I = centerInfo(N);
  if (I.cycles) return I.cycles;
  const len = I.idx.length;
  const pOf = new Map(I.moves.map((m, i) => [m, I.cperm[i]]));
  const inner = I.moves.filter((m) => /^[23]/.test(m));
  const outer = OUTER;
  const seen = new Set();
  const cycles = [];
  for (const s of inner) for (const f of outer) {
    const ps = parseToken(s, N); const pf = parseToken(f, N);
    if (ps.axis === pf.axis) continue;
    for (const b of [...inner, ...outer]) {
      const pb = parseToken(b, N);
      if (pb.axis === pf.axis && b[0] !== '2' && b[0] !== '3') continue;
      const toks = [s, f, invertToken(s), b, s, invertToken(f), invertToken(s), invertToken(b)];
      const from = compose(toks.map((t) => pOf.get(t)), len);
      const moved = [];
      for (let j = 0; j < len; j++) if (from[j] !== j) { moved.push(j); if (moved.length > 3) break; }
      if (moved.length !== 3) continue;
      const key = moved.join(',') + '|' + moved.map((j) => from[j]).join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      cycles.push({ toks, map: moved.map((j) => [from[j], j]) });
    }
  }
  I.cycles = cycles;
  // setup (konjugasi) panjang 0..2
  const setups = [{ toks: [], from: Int16Array.from({ length: len }, (_, i) => i) }];
  I.moves.forEach((m, i) => setups.push({ toks: [m], from: Int16Array.from(I.cperm[i]) }));
  I.moves.forEach((m1, i) => I.moves.forEach((m2, j) => {
    if (I.fam[i].fam === I.fam[j].fam) return;
    if (I.fam[i].axis === I.fam[j].axis && I.fam[j].minL < I.fam[i].minL) return;
    setups.push({ toks: [m1, m2], from: compose([I.cperm[i], I.cperm[j]], len) });
  }));
  I.setups = setups;
  return cycles;
}

function centerSearch(cs, I, ti, col, lockedIdx, lockedCol, maxDepth) {
  const len = cs.length;
  const nM = I.moves.length;
  const bufs = Array.from({ length: maxDepth + 1 }, () => new Uint8Array(len));
  bufs[0].set(cs);
  const path = [];
  const ok = (s) => {
    if (s[ti] !== col) return false;
    for (let k = 0; k < lockedIdx.length; k++) if (s[lockedIdx[k]] !== lockedCol[k]) return false;
    return true;
  };
  function dfs(d, lim, last) {
    const cur = bufs[d]; const nxt = bufs[d + 1];
    for (let i = 0; i < nM; i++) {
      if (last >= 0) {
        const a = I.fam[last]; const b = I.fam[i];
        if (a.fam === b.fam) continue;
        if (a.axis === b.axis && b.minL < a.minL) continue;
      }
      const p = I.cperm[i];
      for (let j = 0; j < len; j++) nxt[j] = cur[p[j]];
      path[d] = i;
      if (d + 1 === lim) { if (ok(nxt)) return true; } else if (dfs(d + 1, lim, i)) return true;
    }
    return false;
  }
  for (let lim = 1; lim <= maxDepth; lim++) if (dfs(0, lim, -1)) return path.slice(0, lim).map((i) => I.moves[i]);
  return null;
}

function centerCommutator(cs, I, ti, col, target, locked) {
  const cycles = I.cycles; const setups = I.setups;
  let best = null;
  for (const S of setups) {
    if (best && S.toks.length * 2 + 8 >= best.len) break;
    const fc = S.from;
    for (const cy of cycles) {
      for (let r = 0; r < 3; r++) {
        const [src, dst] = cy.map[r];
        if (fc[dst] !== ti) continue;
        const P = fc[src];
        if (cs[P] !== col) continue;
        // pasangan berikut: dst -> dst2, dst2 -> src
        const nextPair = cy.map.find((m) => m[0] === dst);
        const q = fc[nextPair[1]];
        if (locked[q] && cs[ti] !== target[q]) continue;
        if (locked[P] && cs[q] !== target[P]) continue;
        const len = S.toks.length * 2 + 8;
        if (!best || len < best.len) best = { len, toks: [...S.toks, ...cy.toks, ...invertAlg(S.toks)] };
      }
    }
  }
  return best ? best.toks : null;
}

export function stageCenters(ctx, scheme) {
  const N = ctx.N;
  const I = centerInfo(N);
  const len = I.idx.length;
  const target = Uint8Array.from(I.face.map((f) => scheme[f]));
  const locked = new Uint8Array(len);
  I.fixed.forEach((fx, i) => { if (fx) locked[i] = 1; });
  ctx.stage('centers', N === 4 ? 'Center (4 keping per sisi)' : 'Center (9 keping per sisi)',
    `Kumpulkan keping tengah tiap sisi sampai warnanya seragam: ${['D', 'U', 'F', 'R', 'B', 'L'].map((f) => ce(scheme[FACE_ID[f]])).join(' ')}. Mulai dari bawah ${ce(scheme[3])}, lalu atas ${ce(scheme[0])}, lalu 4 sisi samping.`,
    ['Gerakan lapisan dalam (2R, 2U, …) memindahkan keping center antarsisi.', 'Selalu kembalikan lapisan dalam setelah menyisipkan keping (misal 2R U 2R\').', 'Sisi yang sudah jadi boleh diputar (U/D) tanpa merusaknya.',
      ...(N === 5 ? ['Di 5x5, center paling tengah tidak bisa pindah — dialah patokan warna sisinya.'] : ['Di 4x4 tidak ada center tetap: warna sisi mengikuti arah pegang yang kamu pilih.'])]);
  const order = [3, 0, 2, 1, 5, 4];
  const FNAME = { U: 'atas', D: 'bawah', F: 'depan', R: 'kanan', B: 'belakang', L: 'kiri' };
  for (const f of order) {
    const positions = [];
    for (let i = 0; i < len; i++) if (I.face[i] === f && !I.fixed[i]) positions.push(i);
    const mid = (N - 1) / 2;
    positions.sort((a, b) => {
      const ra = (I.idx[a] % (N * N)); const rb = (I.idx[b] % (N * N));
      const ta = (Math.floor(ra / N) === mid || ra % N === mid) ? 0 : 1;
      const tb = (Math.floor(rb / N) === mid || rb % N === mid) ? 0 : 1;
      return ta - tb;
    });
    let k = 0;
    for (const ti of positions) {
      k++;
      const cs = Uint8Array.from(I.idx.map((g) => ctx.state[g]));
      const col = target[ti];
      if (cs[ti] === col) { locked[ti] = 1; continue; }
      const lockedIdx = []; const lockedCol = [];
      for (let i = 0; i < len; i++) if (locked[i]) { lockedIdx.push(i); lockedCol.push(target[i]); }
      let sol = centerSearch(cs, I, ti, col, lockedIdx, lockedCol, N === 4 ? 4 : 3);
      let comm = false;
      if (!sol) { buildCycles(N); sol = centerCommutator(cs, I, ti, col, target, locked); comm = true; }
      if (!sol) throw new Error('Center gagal disusun (kemungkinan salah scan)');
      sol = simplify(sol);
      // lacak keping sumber (mundur dari posisi target)
      let src = I.idx[ti];
      for (let j = sol.length - 1; j >= 0; j--) src = movePerm(N, sol[j])[src];
      ctx.step(`Center ${ce(scheme[f])} · keping ${k}/${positions.length}`,
        comm ? `Keping ${ce(col)} yang menyala dipindah ke sisi ${FNAME[FACE_NAMES[f]]} dengan "komutator" (sisipkan – putar – keluarkan – putar balik) supaya center yang sudah jadi tidak rusak.` : `Pindahkan keping ${ce(col)} yang menyala ke sisi ${FNAME[FACE_NAMES[f]]}. Lapisan dalam yang diputar langsung dikembalikan.`,
        sol, { focus: [src] });
      locked[ti] = 1;
    }
  }
  // verifikasi
  for (let i = 0; i < len; i++) if (ctx.state[I.idx[i]] !== target[i]) throw new Error('Center belum lengkap');
}

// ---------------- EDGE PAIRING ----------------
const eCache = new Map();
function edgeInfo(N) {
  if (eCache.has(N)) return eCache.get(N);
  const AX = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 };
  const SG = { U: 1, D: -1, R: 1, L: -1, F: 1, B: -1 };
  const names = ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BR', 'BL', 'DF', 'DR', 'DB', 'DL'];
  const edges = names.map((e) => {
    const a1 = AX[e[0]]; const a2 = AX[e[1]];
    const free = 3 - a1 - a2;
    const pieces = [];
    for (let i = 1; i < N - 1; i++) {
      const p = [0, 0, 0];
      p[a1] = SG[e[0]] * (N - 1); p[a2] = SG[e[1]] * (N - 1); p[free] = 2 * i - (N - 1);
      const s1 = [...p]; s1[a1] = SG[e[0]] * N;
      const s2 = [...p]; s2[a2] = SG[e[1]] * N;
      pieces.push([stickerIndex(N, s1), stickerIndex(N, s2)]);
    }
    return { name: e, pieces, free };
  });
  const stickerOwner = new Map(); // sticker -> {e, i, side}
  edges.forEach((ed, ei) => ed.pieces.forEach((pc, i) => pc.forEach((s, side) => stickerOwner.set(s, { ei, i, side }))));
  const g = geometry(N);
  const toOuter = OUTER.map((m) => inversePerm(N, m));
  const info = { edges, stickerOwner, toOuter, size: g.size };
  eCache.set(N, info);
  return info;
}

function pairMetric(state, N) {
  const { edges } = edgeInfo(N);
  let n = 0;
  if (N === 4) {
    for (const ed of edges) { const [a, b] = ed.pieces; if (state[a[0]] === state[b[0]] && state[a[1]] === state[b[1]]) n++; }
  } else {
    const mid = (N - 1) / 2 - 1; // indeks dalam pieces (i dimulai 1)
    for (const ed of edges) {
      const m = ed.pieces[mid];
      ed.pieces.forEach((w, k) => { if (k !== mid && state[w[0]] === state[m[0]] && state[w[1]] === state[m[1]]) n++; });
    }
  }
  return n;
}
const PAIR_FULL = { 4: 12, 5: 24 };

function centersOk(state, N, scheme) {
  const I = centerInfo(N);
  for (let i = 0; i < I.idx.length; i++) if (state[I.idx[i]] !== scheme[I.face[i]]) return false;
  return true;
}

function applySeq(state, N, toks) {
  let s = state;
  for (const t of toks) {
    const p = movePerm(N, t);
    const n = new Uint8Array(s.length);
    for (let j = 0; j < n.length; j++) n[j] = s[p[j]];
    s = n;
  }
  return s;
}

const M_SET = ["R U R'", "R U' R'", "R U2 R'", "F' U F", "F' U' F", "F' U2 F", "R U R' F R' F' R", "R F' U R' F", "R' F R F'"].map(parseAlg);
function tSet(N) {
  if (N === 4) return ['2U', "2U'", '2U2', '2D', "2D'", '2D2', 'Uw', "Uw'", 'Dw', "Dw'"];
  return ['2U', "2U'", '2U2', '2D', "2D'", '2D2', 'Uw', "Uw'", 'Dw', "Dw'"];
}

function bfsPair(N, xs, ys, cx, cy, Ts, maxDepth) {
  const E = edgeInfo(N);
  const G = E.size;
  const FR = E.edges[4];
  const frSet = new Set(FR.pieces.flat());
  const g = geometry(N);
  const tTo = Ts.map((t) => inversePerm(N, t));
  const found = new Array(Ts.length).fill(null);
  let need = Ts.length;
  const parent = new Map();
  const start = xs * G + ys;
  parent.set(start, null);
  let frontier = [start];
  const check = (code, path) => {
    const a = Math.floor(code / G); const b = code % G;
    for (let ti = 0; ti < Ts.length; ti++) {
      if (found[ti]) continue;
      const a2 = tTo[ti][a]; const b2 = tTo[ti][b];
      if (!frSet.has(a2) || !frSet.has(b2)) continue;
      if (a2 === b2) continue;
      // X harus benar-benar dipindahkan oleh T
      if (tTo[ti][a] === a) continue;
      const fx = g.faceOf[a2]; const fy = g.faceOf[b2];
      const ok = fx === fy ? cx === cy : cx !== cy;
      if (!ok) continue;
      // keping harus beda lapisan
      const ownA = E.stickerOwner.get(a2); const ownB = E.stickerOwner.get(b2);
      if (ownA.i === ownB.i) continue;
      found[ti] = path(); need--;
    }
  };
  const pathOf = (code) => { const out = []; let c = code; while (parent.get(c)) { const [pc, m] = parent.get(c); out.push(OUTER[m]); c = pc; } return out.reverse(); };
  check(start, () => []);
  for (let d = 0; d < maxDepth && need > 0; d++) {
    const nf = [];
    for (const code of frontier) {
      const a = Math.floor(code / G); const b = code % G;
      for (let m = 0; m < OUTER.length; m++) {
        const to = E.toOuter[m];
        const nc = to[a] * G + to[b];
        if (parent.has(nc)) continue;
        parent.set(nc, [code, m]);
        nf.push(nc);
        check(nc, () => pathOf(nc));
      }
    }
    frontier = nf;
  }
  return found;
}

function findPairStep(state, N, scheme) {
  const E = edgeInfo(N);
  const m0 = pairMetric(state, N);
  const Ts = tSet(N);
  const mid = (N - 1) / 2 - 1;
  // daftar wing yang belum cocok
  const xList = [];
  E.edges.forEach((ed, ei) => {
    if (N === 4) {
      const [a, b] = ed.pieces;
      if (state[a[0]] === state[b[0]] && state[a[1]] === state[b[1]]) return;
      ed.pieces.forEach((pc) => xList.push({ pc, ei }));
    } else {
      const m = ed.pieces[mid];
      ed.pieces.forEach((w, k) => { if (k !== mid && !(state[w[0]] === state[m[0]] && state[w[1]] === state[m[1]])) xList.push({ pc: w, ei }); });
    }
  });
  let best = null;
  for (const X of xList) {
    const xc = [state[X.pc[0]], state[X.pc[1]]];
    // cari Y
    const ys = [];
    E.edges.forEach((ed, ei) => ed.pieces.forEach((pc, k) => {
      if (pc === X.pc) return;
      if (N === 4 ? true : k === mid) {
        if (sameSet([state[pc[0]], state[pc[1]]], xc)) ys.push(pc);
      }
    }));
    for (const Y of ys) {
      const found = bfsPair(N, X.pc[0], Y[0], state[X.pc[0]], state[Y[0]], Ts, 5);
      found.forEach((S, ti) => {
        if (!S) return;
        const T = Ts[ti];
        for (let k = 0; k < 4; k++) {
          for (const M of M_SET) {
            const mv = [...S, T, ...uToken(k), ...M, invertToken(T)];
            if (best && mv.length >= best.mv.length) continue;
            const ns = applySeq(state, N, mv);
            if (!centersOk(ns, N, scheme)) continue;
            const m1 = pairMetric(ns, N);
            if (m1 <= m0) continue;
            best = { mv, gain: m1 - m0 };
          }
        }
      });
      if (best && best.mv.length <= 11) return best;
    }
  }
  return best;
}

// Pencarian lebih luas (dipakai untuk 2 edge terakhir): posisikan dua slot edge yang belum jadi
// di lapisan tengah, lalu coba kombinasi slice-flip-slice.
const M_WIDE = [...M_SET, ...["R F' U R' F", "R U R' F R' F' R", "F' U' F R U R'", "R U' R' F' U F"].map(parseAlg)];
function findPairStepWide(state, N, scheme) {
  const E = edgeInfo(N);
  const G = E.size;
  const m0 = pairMetric(state, N);
  const mid = (N - 1) / 2 - 1;
  const unpaired = [];
  E.edges.forEach((ed, ei) => {
    let bad;
    if (N === 4) { const [a, b] = ed.pieces; bad = !(state[a[0]] === state[b[0]] && state[a[1]] === state[b[1]]); } else {
      const m = ed.pieces[mid]; bad = ed.pieces.some((w, k) => k !== mid && !(state[w[0]] === state[m[0]] && state[w[1]] === state[m[1]]));
    }
    if (bad) unpaired.push(ei);
  });
  const eSlots = new Set([4, 5, 6, 7].flatMap((ei) => E.edges[ei].pieces.flat()));
  const frSet = new Set(E.edges[4].pieces.flat());
  const Ts = tSet(N);
  let best = null;
  for (let a = 0; a < unpaired.length; a++) for (let b = a + 1; b < unpaired.length; b++) {
    const sa = E.edges[unpaired[a]].pieces[0][0];
    const sb = E.edges[unpaired[b]].pieces[0][0];
    const start = sa * G + sb;
    const parent = new Map([[start, null]]);
    let frontier = [start];
    const configs = [[]];
    for (let d = 0; d < 4; d++) {
      const nf = [];
      for (const code of frontier) {
        const x = Math.floor(code / G); const y = code % G;
        for (let m = 0; m < OUTER.length; m++) {
          const to = E.toOuter[m];
          const nc = to[x] * G + to[y];
          if (parent.has(nc)) continue;
          parent.set(nc, [code, m]); nf.push(nc);
          if ((eSlots.has(to[x]) && eSlots.has(to[y])) || frSet.has(to[x]) || frSet.has(to[y])) {
            const p = []; let c = nc; while (parent.get(c)) { const [pc, mm] = parent.get(c); p.push(OUTER[mm]); c = pc; }
            configs.push(p.reverse());
          }
        }
      }
      frontier = nf;
    }
    for (const S of configs) {
      if (best && S.length + 4 >= best.mv.length) continue;
      const s1 = applySeq(state, N, S);
      for (const T of Ts) for (let k = 0; k < 4; k++) for (const M of M_WIDE) {
        const tail = [T, ...uToken(k), ...M, invertToken(T)];
        if (best && S.length + tail.length >= best.mv.length) continue;
        const ns = applySeq(s1, N, tail);
        if (!centersOk(ns, N, scheme)) continue;
        const m1 = pairMetric(ns, N);
        if (m1 <= m0) continue;
        best = { mv: [...S, ...tail], gain: m1 - m0 };
      }
    }
    if (best) return best;
  }
  return best;
}

function fixParity5(ctx, scheme) {
  // satu tredge dengan dua wing tertukar -> bawa ke UF lalu rumus parity
  const N = 5;
  const E = edgeInfo(N);
  const st = ctx.state;
  const mid = 1;
  const badE = E.edges.findIndex((ed) => { const m = ed.pieces[mid]; return ed.pieces.some((w, k) => k !== mid && !(st[w[0]] === st[m[0]] && st[w[1]] === st[m[1]])); });
  if (badE < 0) return false;
  const msticker = E.edges[badE].pieces[mid][0];
  const ufSet = new Set(E.edges[0].pieces[mid]);
  // BFS gerakan luar untuk membawa midge ke UF
  const parent = new Map([[msticker, null]]);
  let frontier = [msticker];
  const targets = [];
  if (ufSet.has(msticker)) targets.push([]);
  for (let d = 0; d < 4 && targets.length < 2; d++) {
    const nf = [];
    for (const s of frontier) for (let m = 0; m < OUTER.length; m++) {
      const n = E.toOuter[m][s];
      if (parent.has(n)) continue;
      parent.set(n, [s, m]); nf.push(n);
      if (ufSet.has(n)) { const p = []; let c = n; while (parent.get(c)) { const [pc, mm] = parent.get(c); p.push(OUTER[mm]); c = pc; } targets.push(p.reverse()); }
    }
    frontier = nf;
  }
  if (ctx.flags.parity5) return false;
  const m0 = pairMetric(ctx.state, N);
  let chosen = null;
  for (const S of targets) {
    const mv = [...S, ...parseAlg(PARITY.edge5), ...invertAlg(S)];
    const ns = applySeq(ctx.state, N, mv);
    if (!centersOk(ns, N, scheme)) continue;
    const m1 = pairMetric(ns, N);
    if (!chosen || m1 > chosen.m1) chosen = { mv, m1 };
  }
  if (chosen) {
    ctx.flags.parity5 = true;
    ctx.step('Parity edge 5x5',
      chosen.m1 === 24 ? 'Edge terakhir kedua wing-nya tertukar — ini "parity" khas kubus besar. Bawa edge itu ke depan-atas lalu pakai rumus parity.' : 'Dua wing terakhir hanya bisa ditukar dengan rumus parity (gerakan biasa tidak cukup). Setelah ini, pasangkan seperti biasa.',
      simplify(chosen.mv), { alg: PARITY.edge5 });
    return true;
  }
  return false;
}

export function stageEdges(ctx, scheme) {
  const N = ctx.N;
  ctx.stage('edges', N === 4 ? 'Pasangkan Edge (12 pasang)' : 'Pasangkan Edge (12 trio)',
    N === 4 ? 'Gabungkan dua keping edge yang warnanya sama menjadi satu edge utuh, memakai teknik "slice – flip – slice".' : 'Gabungkan dua wing ke edge tengah (midge) dengan warna sama, memakai teknik "slice – flip – slice".',
    ['Slice: putar lapisan dalam (2U/2D) untuk menyatukan keping.', 'Flip: keluarkan edge yang sudah jadi dengan R U R\' (atau sejenisnya), ganti dengan edge yang belum jadi.', 'Slice balik: kembalikan lapisan dalam supaya center utuh lagi.',
      ...(N === 5 ? ['Kalau edge terakhir kedua wing-nya terbalik, itu "parity" — ada rumus khususnya.'] : [])]);
  let guard = 0;
  while (pairMetric(ctx.state, N) < PAIR_FULL[N] && guard++ < 40) {
    const before = pairMetric(ctx.state, N);
    let best = findPairStep(ctx.state, N, scheme);
    if (!best) best = findPairStepWide(ctx.state, N, scheme);
    if (!best) {
      if (N === 5 && fixParity5(ctx, scheme)) continue;
      throw new Error('Pairing edge macet (kemungkinan salah scan) m=' + pairMetric(ctx.state, N));
    }
    const mv = simplify(best.mv);
    const after = before + best.gain;
    ctx.step(N === 4 ? `Pasangan edge ${Math.min(after, 12)}/12` : `Wing cocok ${Math.min(after, 24)}/24`,
      'Siapkan keping dengan putaran luar, satukan dengan putaran lapisan dalam, keluarkan edge jadi (flip), lalu kembalikan lapisan dalam.',
      mv);
  }
  if (pairMetric(ctx.state, N) < PAIR_FULL[N]) throw new Error('Pairing edge belum selesai');
}

// ---------------- PARITY HOOKS (4x4) ----------------
function llParityMismatch(ctx) {
  const idxE = U_EDGES.map((e) => U_EDGES.findIndex((e2) => ctx.c(e, e[1]) === ctx.center(e2[1])));
  const idxC = U_SLOTS.map((p) => U_SLOTS.findIndex((p2) => sameSet(ctx.colors(p), p2.split('').map((f) => ctx.center(f)))));
  if (idxE.some((x) => x < 0) || idxC.some((x) => x < 0)) return false;
  const par = (arr) => { const seen = new Array(4).fill(false); let p = 0; for (let i = 0; i < 4; i++) { if (seen[i]) continue; let j = i; let l = 0; while (!seen[j]) { seen[j] = true; j = arr[j]; l++; } p += l - 1; } return p % 2; };
  return par(idxE) !== par(idxC);
}

export function parityHooks(N) {
  if (N !== 4) return {};
  return {
    ollParity(ctx) {
      ctx.step('OLL Parity (khusus 4x4)', 'Jumlah edge kuning yang menghadap atas ganjil — ini "OLL parity", hanya terjadi di kubus genap. Rumus panjang ini membalik satu edge depan-atas. Tenang, setelah ini lanjut normal!', PARITY.oll4, { alg: PARITY.oll4, focus: ctx.stickers('UF') });
    },
    pllParity(ctx) {
      if (!llParityMismatch(ctx)) return;
      ctx.step('PLL Parity (khusus 4x4)', 'Ada dua edge atas yang harus ditukar langsung — "PLL parity" khas 4x4. Rumus ini menukar edge depan-atas dengan belakang-atas.', PARITY.pll4, { alg: PARITY.pll4 });
    },
  };
}

export { pairMetric, centerInfo, buildCycles, peek, edgeInfo, fixParity5 };
