// Metode CFOP: Cross (optimal), F2L (intuitif, pasangan), OLL, PLL (full atau 2-look)
import { inversePerm, movePerm, parseAlg } from '../cube.js';
import { st, EDGES, CORNERS, uToken, yToken, sameSet } from '../pieces.js';
import { OUTER_MOVES } from './search.js';
import { peek, SIDE, D_SLOTS, MID_SLOTS, yText, uText } from './lbl.js';
import { ce, cn, piece } from './ctx.js';
import { OLL, PLL, OLL2_EDGES, OLL2_CORNERS, PLL2_CORNERS, PLL2_EDGES } from './algs.js';

// ---------- tabel cross ----------
let CR = null;
function initCross() {
  if (CR) return CR;
  const edgeSlots = [];
  const slotOf = new Int16Array(54).fill(-1);
  for (const e of EDGES) for (const f of e) { const idx = st(3, e, f); slotOf[idx] = edgeSlots.length; edgeSlots.push(idx); }
  const moveSlot = OUTER_MOVES.map((m) => { const to = inversePerm(3, m); return Int16Array.from(edgeSlots.map((idx) => slotOf[to[idx]])); });
  const target = ['DF', 'DR', 'DB', 'DL'].map((e) => slotOf[st(3, e, 'D')]);
  const enc = (a, b, c, d) => ((a * 24 + b) * 24 + c) * 24 + d;
  const table = new Uint8Array(24 ** 4).fill(255);
  const q = new Int32Array(24 ** 4);
  let head = 0; let tail = 0;
  const t0 = enc(...target);
  table[t0] = 0; q[tail++] = t0;
  while (head < tail) {
    const cur = q[head++];
    const d = cur % 24; const c = Math.floor(cur / 24) % 24; const b = Math.floor(cur / 576) % 24; const a = Math.floor(cur / 13824);
    const dist = table[cur];
    for (let m = 0; m < 18; m++) {
      const ms = moveSlot[m];
      const nx = enc(ms[a], ms[b], ms[c], ms[d]);
      if (table[nx] === 255) { table[nx] = dist + 1; q[tail++] = nx; }
    }
  }
  CR = { slotOf, moveSlot, table, enc };
  return CR;
}

function crossSolve(ctx) {
  const { slotOf, moveSlot, table, enc } = initCross();
  const base = ctx.center('D');
  const s3 = ctx.view3();
  const center3 = (f) => s3[st(3, f, f)];
  const cur = SIDE.map((X) => {
    const cx = center3(X);
    for (const e of EDGES) {
      const cols = e.split('').map((f) => s3[st(3, e, f)]);
      if (sameSet(cols, [base, cx])) { const f = e[cols.indexOf(base)]; return slotOf[st(3, e, f)]; }
    }
    throw new Error('Edge cross tidak ditemukan');
  });
  let [a, b, c, d] = cur;
  let dist = table[enc(a, b, c, d)];
  const moves = [];
  while (dist > 0) {
    let found = false;
    for (let m = 0; m < 18; m++) {
      const ms = moveSlot[m];
      const n = [ms[a], ms[b], ms[c], ms[d]];
      if (table[enc(...n)] === dist - 1) { moves.push(OUTER_MOVES[m]); [a, b, c, d] = n; dist--; found = true; break; }
    }
    if (!found) throw new Error('Cross gagal');
  }
  return moves;
}

// ---------- tabel F2L (pemicu intuitif) ----------
const TRIGGERS = ['U', "U'", 'U2', "R U R'", "R U' R'", "R U2 R'", "F' U F", "F' U' F", "F' U2 F", "R' F R F'", "F R' F' R"];
let F2 = null;
function composePerm(moves) {
  let from = null;
  for (const t of parseAlg(moves)) {
    const p = movePerm(3, t);
    if (!from) { from = Uint16Array.from(p); continue; }
    const nf = new Uint16Array(54);
    for (let j = 0; j < 54; j++) nf[j] = from[p[j]];
    from = nf;
  }
  return from;
}
function initF2L() {
  if (F2) return F2;
  const cSlots = []; const cSlotOf = new Int16Array(54).fill(-1);
  for (const c of CORNERS) for (const f of c) { const i = st(3, c, f); cSlotOf[i] = cSlots.length; cSlots.push(i); }
  const eSlots = []; const eSlotOf = new Int16Array(54).fill(-1);
  for (const e of EDGES) for (const f of e) { const i = st(3, e, f); eSlotOf[i] = eSlots.length; eSlots.push(i); }
  // posisi yang boleh berubah: lapisan U + slot FR
  const free = new Set();
  for (const p of ['UFR', 'UFL', 'UBL', 'UBR', 'DFR']) for (const f of p) free.add(st(3, p, f));
  for (const p of ['UF', 'UR', 'UB', 'UL', 'FR']) for (const f of p) free.add(st(3, p, f));
  for (const f of 'U') free.add(st(3, 'U', 'U'));
  const trig = [];
  for (const t of TRIGGERS) {
    const from = composePerm(t);
    let ok = true;
    for (let j = 0; j < 54; j++) if (!free.has(j) && from[j] !== j) { ok = false; break; }
    if (!ok) continue;
    const to = new Uint16Array(54); for (let j = 0; j < 54; j++) to[from[j]] = j;
    const ct = cSlots.map((i) => cSlotOf[to[i]]);
    const et = eSlots.map((i) => eSlotOf[to[i]]);
    const inv = new Int16Array(24); const invE = new Int16Array(24);
    ct.forEach((d, s) => { inv[d] = s; }); et.forEach((d, s) => { invE[d] = s; });
    trig.push({ alg: t, w: parseAlg(t).length, ct, et, inv, invE });
  }
  const target = cSlotOf[st(3, 'DFR', 'D')] * 24 + eSlotOf[st(3, 'FR', 'F')];
  const dist = new Float64Array(576).fill(Infinity);
  const next = new Int16Array(576).fill(-1);
  dist[target] = 0;
  const done = new Uint8Array(576);
  for (;;) {
    let u = -1; let best = Infinity;
    for (let i = 0; i < 576; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0) break;
    done[u] = 1;
    const cu = Math.floor(u / 24); const eu = u % 24;
    trig.forEach((t, ti) => {
      // pendahulu p dengan t(p) = u
      const p = t.inv[cu] * 24 + t.invE[eu];
      const nd = best + t.w + 0.01 * (t.w > 1 ? 1 : 0);
      if (nd < dist[p]) { dist[p] = nd; next[p] = ti; }
    });
  }
  F2 = { cSlotOf, eSlotOf, trig, dist, next, target };
  return F2;
}

function f2lPairSolved(ctx) {
  return ['D', 'F', 'R'].every((f) => ctx.c('DFR', f) === ctx.center(f)) && ['F', 'R'].every((f) => ctx.c('FR', f) === ctx.center(f));
}

function f2lPlan(t) {
  const { cSlotOf, eSlotOf, trig, dist, next } = initF2L();
  const base = t.center('D'); const cF = t.center('F'); const cR = t.center('R');
  let cpos = null; let epos = null;
  for (const c of CORNERS) if (sameSet(t.colors(c), [base, cF, cR])) cpos = c;
  for (const e of EDGES) if (sameSet(t.colors(e), [cF, cR])) epos = e;
  const legalC = cpos[0] === 'U' || cpos === 'DFR';
  const legalE = epos[0] === 'U' || epos === 'FR';
  if (!legalC || !legalE) return { stuck: true, cpos, epos };
  const cs = cSlotOf[st(3, cpos, cpos[t.colors(cpos).indexOf(base)])];
  const es = eSlotOf[st(3, epos, epos[t.colors(epos).indexOf(cF)])];
  let s = cs * 24 + es;
  const chain = [];
  let g = 0;
  while (dist[s] > 0 && g++ < 30) {
    const tr = trig[next[s]];
    chain.push(tr.alg);
    s = tr.ct[Math.floor(s / 24)] * 24 + tr.et[s % 24];
  }
  return { stuck: false, chain, cost: dist[cs * 24 + es] };
}

export function stageCrossCFOP(ctx) {
  const base = ctx.center('D');
  ctx.stage('cross', 'Cross',
    `Bentuk silang ${ce(base)} langsung di bawah, dengan warna samping cocok dengan tengahnya. Solusi ini sudah optimal (paling sedikit gerakan).`,
    ['Latih cross tanpa melihat (inspeksi 15 detik) — rata-rata cross optimal ≤ 8 gerakan.', 'Biasakan membuat cross di BAWAH supaya F2L terlihat.']);
  const moves = crossSolve(ctx);
  if (moves.length) ctx.step(`Cross ${ce(base)}`, `${moves.length} gerakan untuk menyusun keempat edge ${ce(base)} sekaligus.`, moves);
}

export function stageF2L(ctx) {
  const base = ctx.center('D');
  ctx.stage('f2l', 'F2L (Dua Lapisan Pertama)',
    'Pasangkan sudut dan edge yang serasi, lalu masukkan bersama ke slotnya. Rumusnya dibangun dari "pemicu" pendek: R U R\', F\' U\' F, dst.',
    ['Cari pasangan yang paling mudah dulu.', 'Pisahkan dulu kalau sudut & edge "salah sambung", lalu sambungkan kembali.', 'Usahakan tidak memutar seluruh kubus — lihat slot belakang dari samping.']);
  let guard = 0;
  while (guard++ < 16) {
    let best = null;
    for (let k = 0; k < 4; k++) {
      const t = peek(ctx, yToken(k));
      if (f2lPairSolved(t)) continue;
      const plan = f2lPlan(t);
      const cost = plan.stuck ? 1000 : plan.cost + (k ? 1 : 0);
      if (!best || cost < best.cost) best = { k, plan, cost, t };
    }
    if (!best) return;
    const { k, plan, t } = best;
    const cF = t.center('F'); const cR = t.center('R');
    if (plan.stuck) {
      // keluarkan keping yang terjebak di slot lain
      const pos = (plan.cpos[0] === 'D' && plan.cpos !== 'DFR') ? plan.cpos : plan.epos;
      // posisi dalam frame awal
      const t0 = peek(ctx, []);
      const want = pos.length === 3 ? [base, cF, cR] : [cF, cR];
      let orig = null;
      for (const p of (pos.length === 3 ? CORNERS : EDGES)) if (sameSet(t0.colors(p), want)) orig = p;
      const j = pos.length === 3 ? D_SLOTS.indexOf(orig) : MID_SLOTS.indexOf(orig);
      ctx.step('Keluarkan keping terjebak',
        `${yText(j)}Keping ${piece(want)} terjebak di slot lain. Keluarkan dengan R U R'.`,
        [...yToken(j), 'R', 'U', "R'"], { focus: ctx.stickers(orig) });
      continue;
    }
    const pre = yToken(k);
    ctx.step(`Pasangan ${piece([base, cF, cR])}`,
      `${yText(k)}Slot tujuan di kanan-depan. Urutan pemicu: ${plan.chain.map((c) => '(' + c + ')').join(' ')}.`,
      [...pre, ...plan.chain.flatMap((c) => parseAlg(c))], { focus: [] });
  }
}

function topAll(ctx) {
  const top = ctx.center('U');
  for (const p of ['UFR', 'UFL', 'UBL', 'UBR', 'UF', 'UR', 'UB', 'UL']) if (ctx.c(p, 'U') !== top) return false;
  return true;
}
function topEdgesOriented(ctx) {
  const top = ctx.center('U');
  return ['UF', 'UR', 'UB', 'UL'].every((p) => ctx.c(p, 'U') === top);
}
function view3Solved(ctx) {
  const v = ctx.view3();
  for (let f = 0; f < 6; f++) for (let i = 0; i < 9; i++) if (v[f * 9 + i] !== v[f * 9 + 4]) return false;
  return true;
}
function cornersPermuted(ctx) {
  return ['UFR', 'UFL', 'UBL', 'UBR'].every((p) => sameSet(ctx.colors(p), p.split('').map((f) => ctx.center(f))));
}

function findAlg(ctx, set, pred, post = false) {
  let best = null;
  for (let k = 0; k < 4; k++) {
    for (const a of set) {
      const pre = [...uToken(k), ...parseAlg(a.alg)];
      for (let j = 0; j < (post ? 4 : 1); j++) {
        const mv = [...pre, ...uToken(j)];
        const t = peek(ctx, mv);
        if (pred(t)) {
          if (!best || mv.length < best.mv.length) best = { mv, a, k, j };
        }
      }
    }
  }
  return best;
}

export function stageOLL(ctx, full, hooks = {}) {
  const top = ctx.center('U');
  ctx.stage('oll', full ? 'OLL (57 kasus)' : 'OLL 2-Look',
    full ? `Buat seluruh sisi atas ${ce(top)} dalam satu rumus. Kenali polanya, lalu pakai rumus yang sesuai.` : `Dua langkah: 1) silang ${ce(top)} di atas, 2) sudut ${ce(top)}. Cukup 10 rumus!`,
    ['Kenali pola dari bentuk warna atas dan stiker samping lapisan atas.', 'Mulai dari 2-look, lalu tambah rumus OLL penuh pelan-pelan.']);
  if (topAll(ctx)) { ctx.note('OLL dilewati', 'Sisi atas sudah jadi — OLL skip! 🍀'); return; }
  const top4 = ['UF', 'UR', 'UB', 'UL'].filter((p) => ctx.c(p, 'U') === top).length;
  if (top4 % 2 === 1) {
    if (hooks.ollParity) hooks.ollParity(ctx); else throw new Error('Orientasi edge tidak mungkin (kemungkinan salah scan)');
    if (topAll(ctx)) return;
  }
  if (full) {
    const b = findAlg(ctx, OLL, topAll);
    if (b) {
      ctx.step(b.a.name, `${uText(b.k)}Kasus ${b.a.name}. Rumus: ${b.a.alg}`, b.mv, { alg: b.a.alg });
      return;
    }
  }
  if (!topEdgesOriented(ctx)) {
    const b = findAlg(ctx, OLL2_EDGES, topEdgesOriented);
    if (!b) throw new Error('OLL edge gagal');
    ctx.step(`Silang atas: ${b.a.name}`, `${uText(b.k)}Pola ${b.a.name}. Rumus: ${b.a.alg}`, b.mv, { alg: b.a.alg });
  }
  if (!topAll(ctx)) {
    const b = findAlg(ctx, OLL2_CORNERS, topAll);
    if (!b) throw new Error('OLL sudut gagal');
    ctx.step(`Sudut atas: ${b.a.name}`, `${uText(b.k)}Pola ${b.a.name}. Rumus: ${b.a.alg}`, b.mv, { alg: b.a.alg });
  }
}

export function stagePLL(ctx, full, hooks = {}) {
  ctx.stage('pll', full ? 'PLL (21 kasus)' : 'PLL 2-Look',
    full ? 'Tukar posisi keping lapisan atas dalam satu rumus. Lihat "lampu depan" (2 stiker sama di satu sisi) untuk mengenali kasus.' : 'Dua langkah: 1) susun sudut (T-perm / Y-perm), 2) susun edge (U, H, Z-perm).',
    ['Cari "headlights": dua sudut berwarna sama di satu sisi.', 'Selesaikan dengan putaran U terakhir (AUF).']);
  if (hooks.pllParity) hooks.pllParity(ctx);
  for (let k = 0; k < 4; k++) {
    const t = peek(ctx, uToken(k));
    if (view3Solved(t)) { ctx.step('PLL dilewati', `${uText(k)}Lapisan atas sudah tersusun! 🍀`, uToken(k)); return; }
  }
  if (full) {
    const b = findAlg(ctx, PLL, view3Solved, true);
    if (b) { ctx.step(b.a.name, `${uText(b.k)}Kasus ${b.a.name}. Rumus: ${b.a.alg}${b.j ? '. Akhiri dengan putaran U.' : ''}`, b.mv, { alg: b.a.alg }); return; }
  }
  // 2-look
  let cOk = false;
  for (let k = 0; k < 4; k++) if (cornersPermuted(peek(ctx, uToken(k)))) cOk = true;
  if (!cOk) {
    const b = findAlg(ctx, PLL2_CORNERS, (t) => { for (let j = 0; j < 4; j++) if (cornersPermuted(peek(t, uToken(j)))) return true; return false; });
    if (!b) throw new Error('PLL sudut gagal');
    ctx.step(`Sudut: ${b.a.name}`, `${uText(b.k)}Rumus: ${b.a.alg}`, b.mv, { alg: b.a.alg });
  }
  for (let k = 0; k < 4; k++) {
    const t = peek(ctx, uToken(k));
    if (view3Solved(t)) { if (k) ctx.step('Putaran akhir', `${uText(k)}Selesai! 🎉`, uToken(k)); return; }
  }
  const b = findAlg(ctx, PLL2_EDGES, view3Solved, true);
  if (!b) throw new Error('PLL edge gagal');
  ctx.step(`Edge: ${b.a.name}`, `${uText(b.k)}Rumus: ${b.a.alg}${b.j ? '. Akhiri dengan putaran U.' : ''}`, b.mv, { alg: b.a.alg });
}

export function solveCFOP3(ctx, full, hooks = {}) {
  stageCrossCFOP(ctx);
  stageF2L(ctx);
  stageOLL(ctx, full, hooks);
  stagePLL(ctx, full, hooks);
}

export { initF2L, cn };
