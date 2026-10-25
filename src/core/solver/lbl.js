// Metode Pemula (Layer-by-Layer) — dipakai 3x3, tahap 3x3 kubus besar, dan (sebagian) 2x2.
import { iddfs, OUTER_MOVES } from './search.js';
import { st, CORNERS, U_EDGE_CYCLE, U_CORNER_CYCLE, uTurnsTo, uToken, yToken, sameSet } from '../pieces.js';
import { ce, cn, piece, repeat } from './ctx.js';

export const SIDE = ['F', 'R', 'B', 'L'];
export const FN = { U: 'atas', D: 'bawah', F: 'depan', B: 'belakang', R: 'kanan', L: 'kiri' };
const U_EDGES = ['UF', 'UR', 'UB', 'UL'];
const D_EDGES = ['DF', 'DR', 'DB', 'DL'];
const MID_SLOTS = ['FR', 'BR', 'BL', 'FL']; // indeks slot 0..3 (sisi pertama F,R,B,L)
const D_SLOTS = ['DFR', 'DBR', 'DBL', 'DFL'];
const U_SLOTS = ['UFR', 'UBR', 'UBL', 'UFL'];

export const ALG = {
  sexy: "R U R' U'",
  rightIns: "U R U' R' U' F' U F",
  leftIns: "U' L' U L U F U' F'",
  cross: "F R U R' U' F'",
  sune: "R U R' U R U2 R' U",
  corners: "U R U' L' U R' U' L",
  twist: "R' D' R D",
};

// ---------- utilitas ----------
export function peek(ctx, moves) {
  const c = Object.create(Object.getPrototypeOf(ctx));
  c.N = ctx.N; c.state = Uint8Array.from(ctx.state); c.vc = ctx.vc ? ctx.vc.slice() : null;
  c.stages = []; c.cur = null; c.flags = ctx.flags;
  c.applyRaw(moves);
  return c;
}

function findEdge(ctx, cols, names) {
  for (const e of names) if (sameSet(ctx.colors(e), cols)) return e;
  return null;
}
function findCorner(ctx, cols) {
  for (const c of CORNERS) if (sameSet(ctx.colors(c), cols)) return c;
  return null;
}
const ALL_EDGES = ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BR', 'BL', 'DF', 'DR', 'DB', 'DL'];

function sideIndexOfColor(ctx, color) {
  return SIDE.findIndex((f) => ctx.center(f) === color);
}

// slot (pasangan sisi) -> indeks (sisi pertama searah F,R,B,L)
function slotIndexFor(ctx, a, b) {
  const ia = sideIndexOfColor(ctx, a);
  const ib = sideIndexOfColor(ctx, b);
  if (ia < 0 || ib < 0) throw new Error('Warna center tidak ditemukan');
  return ((ib - ia + 4) % 4) === 1 ? ia : ib;
}

function cornerSolvedAt(ctx, pos) {
  for (const f of pos) if (ctx.c(pos, f) !== ctx.center(f)) return false;
  return true;
}
function edgeSolvedAt(ctx, pos) {
  for (const f of pos) if (ctx.c(pos, f) !== ctx.center(f)) return false;
  return true;
}

function yText(k) {
  if (!k) return '';
  return k === 2 ? 'Putar seluruh kubus 180° (y2). ' : k === 1 ? 'Putar seluruh kubus ke kiri (y) — sisi kanan pindah ke depan. ' : "Putar seluruh kubus ke kanan (y') — sisi kiri pindah ke depan. ";
}
function uText(k, what = 'lapisan atas') {
  if (!k) return '';
  return k === 2 ? `Putar ${what} 2x (U2). ` : k === 1 ? `Putar ${what} ke kiri (U). ` : `Putar ${what} ke kanan (U'). `;
}

// ---------- Tahap: Bunga (daisy) ----------
function daisyScore(s3, base) {
  let n = 0;
  for (const e of U_EDGES) if (s3[st(3, e, 'U')] === base) n++;
  for (const e of D_EDGES) {
    const side = e[1];
    if (s3[st(3, e, 'D')] === base && s3[st(3, e, side)] === s3[st(3, side, side)]) n++;
  }
  return n;
}

export function stageDaisy(ctx) {
  const base = ctx.center('D');
  const top = ctx.center('U');
  ctx.stage('daisy', 'Bunga (Daisy)',
    `Bawa ke-4 edge ${ce(base)} ke lapisan atas dengan warna ${cn(base)} menghadap ATAS, mengelilingi tengah ${ce(top)}. Bentuknya seperti bunga 🌼.`,
    [`Edge = keping dengan 2 warna. Cari yang punya warna ${cn(base)}.`, 'Kalau tempat di atas sudah terisi kelopak, putar U dulu supaya ada tempat kosong.', 'Edge yang sudah benar di silang bawah boleh dibiarkan.']);
  let guard = 0;
  while (guard++ < 10) {
    const s3 = ctx.view3();
    const score = daisyScore(s3, base);
    if (score >= 4) break;
    const sol = iddfs(s3, 3, OUTER_MOVES, 7, (s) => daisyScore(s, base) > score);
    if (!sol) throw new Error('Tahap bunga gagal');
    // cari edge yang baru terpasang
    const before = {};
    for (const e of ALL_EDGES) { const cols = ctx.colors(e); if (cols.includes(base)) before[cols.find((x) => x !== base)] = e; }
    const after = peek(ctx, sol);
    let placed = null;
    for (const other of Object.keys(before)) {
      const o = Number(other);
      const posA = findEdge(after, [base, o], ALL_EDGES);
      const okA = (posA[0] === 'U' && after.c(posA, 'U') === base) || (posA[0] === 'D' && after.c(posA, 'D') === base && after.c(posA, posA[1]) === after.center(posA[1]));
      const posB = before[other];
      const okB = (posB[0] === 'U' && ctx.c(posB, 'U') === base) || (posB[0] === 'D' && ctx.c(posB, 'D') === base && ctx.c(posB, posB[1]) === ctx.center(posB[1]));
      if (okA && !okB) { placed = { o, pos: posB, posA }; break; }
    }
    const pc = placed ? piece([base, placed.o]) : 'edge';
    const toCross = placed && placed.posA[0] === 'D';
    ctx.step(`Kelopak: ${pc}`,
      toCross ? `Edge ${pc} bisa langsung masuk ke silang bawah dengan warna yang cocok.` : `Naikkan edge ${pc} ke atas sehingga ${ce(base)} menghadap ke atas, tanpa menjatuhkan kelopak lain.`,
      sol, { focus: placed ? ctx.stickers(placed.pos) : [] });
  }
}

// ---------- Tahap: Silang (cross) ----------
export function stageCross(ctx) {
  const base = ctx.center('D');
  ctx.stage('cross', 'Silang Bawah (Cross)',
    `Turunkan kelopak satu per satu: samakan warna samping edge dengan warna tengahnya, lalu putar sisi itu 2x. Hasilnya: tanda plus ${ce(base)} di bawah dengan samping yang cocok.`,
    ['Lihat warna SAMPING kelopak, bukan warna atasnya.', 'Putaran 2x (misal F2) arahnya bebas, hasilnya sama.']);
  for (let i = 0; i < 4; i++) {
    const petals = U_EDGES.filter((e) => ctx.c(e, 'U') === base);
    if (!petals.length) break;
    let best = null;
    for (const e of petals) {
      const sc = ctx.c(e, e[1]);
      const tf = SIDE.find((f) => ctx.center(f) === sc);
      const k = uTurnsTo(U_EDGE_CYCLE, e, 'U' + tf);
      const cost = k === 0 ? 0 : 1;
      if (!best || cost < best.cost) best = { e, sc, tf, k, cost };
    }
    const { e, sc, tf, k } = best;
    ctx.step(`Turunkan ${piece([base, sc])}`,
      `${uText(k)}Warna ${ce(sc)} di edge harus sejajar dengan tengah ${ce(sc)} (sisi ${FN[tf]}). Lalu putar sisi ${FN[tf]} 2x (${tf}2) — edge turun ke bawah.`,
      [...uToken(k), tf + '2'], { focus: ctx.stickers(e) });
  }
  if (D_EDGES.some((e) => !(ctx.c(e, 'D') === base && ctx.c(e, e[1]) === ctx.center(e[1])))) throw new Error('Silang gagal');
}

// ---------- Tahap: sudut lapisan pertama ----------
export function stageFirstCorners(ctx, opts = {}) {
  const base = ctx.center('D');
  const is2 = ctx.N === 2;
  ctx.stage('corners1', is2 ? 'Lapisan Pertama' : 'Sudut Lapisan Pertama',
    `Masukkan sudut ${ce(base)} satu per satu ke lapisan bawah. Rumus andalan: ${ALG.sexy} (si "sexy move") diulang sampai sudutnya pas.`,
    ['Sudut = keping dengan 3 warna.', 'Taruh sudut tepat DI ATAS slot tujuannya (kanan-depan), lalu ulangi R U R\' U\'.', 'Maksimal 5x pengulangan. Jangan panik kalau sudutnya terlihat terpelintir dulu!',
      ...(is2 ? ['Di 2x2 tidak ada tengah: warna "tengah" mengikuti arah pegang yang kamu pilih.'] : [])]);
  let guard = 0;
  while (guard++ < 40) {
    const list = [];
    for (const pos of CORNERS) {
      const cols = ctx.colors(pos);
      if (cols.includes(base)) list.push({ pos, cols, solved: pos[0] === 'D' && cornerSolvedAt(ctx, pos) });
    }
    const unsolved = list.filter((c) => !c.solved);
    if (!unsolved.length) break;
    // pilih: utamakan yang sudah di atas
    const c = unsolved.find((x) => x.pos[0] === 'U') || unsolved[0];
    const others = c.cols.filter((x) => x !== base);
    if (c.pos[0] === 'D') {
      const k = D_SLOTS.indexOf(c.pos);
      ctx.step(`Keluarkan ${piece(c.cols)}`,
        `${yText(k)}Sudut ini ada di bawah tapi salah tempat/terbalik. Keluarkan dulu ke atas dengan ${ALG.sexy} satu kali.`,
        [...yToken(k), ...ALG.sexy.split(' ')], { focus: ctx.stickers(c.pos) });
      continue;
    }
    const k = slotIndexFor(ctx, others[0], others[1]);
    const t = peek(ctx, yToken(k));
    const posAfterY = findCorner(t, c.cols);
    const ku = uTurnsTo(U_CORNER_CYCLE, posAfterY, 'UFR');
    const setup = [...yToken(k), ...uToken(ku)];
    if (setup.length) {
      ctx.step(`Siapkan ${piece(c.cols)}`,
        `${yText(k)}Slot tujuan (antara ${ce(others[0])} dan ${ce(others[1])}) sekarang di kanan-depan bawah. ${uText(ku)}Sudut harus berada tepat di atas slotnya.`,
        setup, { focus: ctx.stickers(c.pos) });
    }
    // hitung pengulangan
    let n = 0;
    let probe = peek(ctx, []);
    while (n < 6) {
      probe.applyRaw(ALG.sexy);
      n++;
      if (cornerSolvedAt(probe, 'DFR')) break;
    }
    if (n >= 6) throw new Error('Sudut tidak bisa dimasukkan');
    const focusPos = 'UFR';
    ctx.step(`Masukkan ${piece(c.cols)}`,
      `Ulangi ${ALG.sexy} sebanyak ${n}x sampai sudut masuk dengan ${ce(base)} menghadap bawah.`,
      repeat(ALG.sexy, n), { focus: ctx.stickers(focusPos), alg: ALG.sexy });
  }
}

// ---------- Tahap: lapisan tengah ----------
export function stageMiddle(ctx) {
  const base = ctx.center('D');
  const top = ctx.center('U');
  ctx.stage('middle', 'Lapisan Tengah',
    `Masukkan 4 edge tanpa warna ${ce(top)} ke lapisan tengah. Balik dulu cara pandangmu: ${ce(top)} di atas, lapisan ${ce(base)} yang sudah jadi ada di bawah.`,
    ['Cari edge di atas yang TIDAK punya warna ' + cn(top) + '.', 'Samakan warna depan edge dengan tengah depan sehingga membentuk huruf T terbalik.',
      `Edge mau ke KANAN: ${ALG.rightIns}`, `Edge mau ke KIRI: ${ALG.leftIns}`]);
  let guard = 0;
  while (guard++ < 30) {
    const done = MID_SLOTS.every((p) => edgeSolvedAt(ctx, p));
    if (done) break;
    const cand = U_EDGES.filter((e) => { const cols = ctx.colors(e); return !cols.includes(top) && !cols.includes(base); });
    if (cand.length) {
      // pilih dengan setup paling pendek
      let best = null;
      for (const e of cand) {
        const s = ctx.c(e, e[1]);
        const tcol = ctx.c(e, 'U');
        const k = sideIndexOfColor(ctx, s);
        const t = peek(ctx, yToken(k));
        const pos = findEdge(t, [s, tcol], U_EDGES);
        const ku = uTurnsTo(U_EDGE_CYCLE, pos, 'UF');
        const cost = (k ? 1 : 0) + (ku ? 1 : 0);
        if (!best || cost < best.cost) best = { e, s, tcol, k, ku, cost };
      }
      const { e, s, tcol, k, ku } = best;
      const setup = [...yToken(k), ...uToken(ku)];
      if (setup.length) {
        ctx.step(`Siapkan ${piece([s, tcol])}`,
          `${yText(k)}${uText(ku)}Buat huruf T terbalik: warna ${ce(s)} edge sejajar dengan tengah ${ce(s)} di depan.`,
          setup, { focus: ctx.stickers(e) });
      }
      const right = ctx.center('R') === tcol;
      ctx.step(`Masukkan ke ${right ? 'kanan' : 'kiri'}`,
        `Warna atas edge (${ce(tcol)}) cocok dengan tengah ${right ? 'kanan' : 'kiri'}, jadi pakai rumus ${right ? 'kanan' : 'kiri'}: ${right ? ALG.rightIns : ALG.leftIns}.`,
        right ? ALG.rightIns : ALG.leftIns, { focus: ctx.stickers('UF'), alg: right ? ALG.rightIns : ALG.leftIns });
    } else {
      const k = MID_SLOTS.findIndex((p) => !edgeSolvedAt(ctx, p));
      const pos = MID_SLOTS[k];
      ctx.step('Keluarkan edge yang salah',
        `${yText(k)}Edge di lapisan tengah ini salah tempat atau terbalik. Keluarkan dengan rumus kanan (${ALG.rightIns}), nanti dimasukkan lagi dengan benar.`,
        [...yToken(k), ...ALG.rightIns.split(' ')], { focus: ctx.stickers(pos), alg: ALG.rightIns });
    }
  }
  if (!MID_SLOTS.every((p) => edgeSolvedAt(ctx, p))) throw new Error('Lapisan tengah gagal');
}

// ---------- Tahap: silang atas ----------
export function stageTopCross(ctx, hooks = {}) {
  const top = ctx.center('U');
  ctx.stage('topcross', 'Silang Atas',
    `Bentuk tanda plus ${ce(top)} di atas. Cukup satu rumus: ${ALG.cross}. Perhatikan polanya: titik → huruf L → garis → plus.`,
    ['Abaikan sudut dulu, fokus ke 4 edge saja.', 'Huruf L: pegang di "jam 9 dan jam 12" (kiri & belakang).', 'Garis: pegang mendatar (kiri-kanan).']);
  let guard = 0;
  while (guard++ < 10) {
    const ori = U_EDGES.filter((e) => ctx.c(e, 'U') === top);
    if (ori.length === 4) return;
    if (ori.length % 2 === 1) {
      if (hooks.ollParity) { hooks.ollParity(ctx); continue; }
      throw new Error('Orientasi edge tidak mungkin (kemungkinan salah scan)');
    }
    if (ori.length === 0) {
      ctx.step('Pola titik', `Hanya titik tengah ${ce(top)}. Lakukan ${ALG.cross} — nanti muncul huruf L.`, ALG.cross, { alg: ALG.cross });
      continue;
    }
    const set = new Set(ori);
    const isLine = (set.has('UF') && set.has('UB')) || (set.has('UL') && set.has('UR'));
    let kk = 0;
    for (let k = 0; k < 4; k++) {
      const t = peek(ctx, uToken(k));
      const o = U_EDGES.filter((e) => t.c(e, 'U') === top);
      const s2 = new Set(o);
      if (isLine ? (s2.has('UL') && s2.has('UR')) : (s2.has('UB') && s2.has('UL'))) { kk = k; break; }
    }
    ctx.step(isLine ? 'Pola garis' : 'Pola huruf L',
      `${uText(kk)}${isLine ? 'Pegang garisnya mendatar (kiri-kanan)' : 'Pegang huruf L di kiri & belakang (jam 9 & jam 12)'}, lalu ${ALG.cross}.`,
      [...uToken(kk), ...ALG.cross.split(' ')], { alg: ALG.cross });
  }
  throw new Error('Silang atas gagal');
}

// ---------- Tahap: edge atas (posisi) ----------
function topEdgeMatches(ctx) {
  return U_EDGES.filter((e) => ctx.c(e, e[1]) === ctx.center(e[1]));
}

export function stageTopEdges(ctx, hooks = {}) {
  const top = ctx.center('U');
  ctx.stage('topedges', 'Edge Atas',
    `Samakan warna samping edge ${ce(top)} dengan tengahnya. Rumus: ${ALG.sune}.`,
    ['Putar U dulu sampai minimal 2 edge cocok.', 'Kalau 2 edge cocok bersebelahan: pegang di BELAKANG dan KANAN.', 'Kalau cocoknya berseberangan: lakukan rumus sekali dari mana saja.']);
  if (hooks.pllParity) hooks.pllParity(ctx);
  let guard = 0;
  while (guard++ < 8) {
    let bestK = 0; let bestM = -1;
    for (let k = 0; k < 4; k++) {
      const m = topEdgeMatches(peek(ctx, uToken(k))).length;
      if (m > bestM) { bestM = m; bestK = k; }
    }
    if (bestM === 4) {
      ctx.step('Edge atas selesai', `${uText(bestK)}Semua edge atas sudah cocok dengan tengahnya.`, uToken(bestK));
      return;
    }
    const t = peek(ctx, uToken(bestK));
    const m = new Set(topEdgeMatches(t));
    const adjacent = !((m.has('UF') && m.has('UB')) || (m.has('UL') && m.has('UR')));
    if (adjacent && bestM === 2) {
      let ky = 0;
      for (let k = 0; k < 4; k++) {
        const t2 = peek(t, yToken(k));
        const m2 = new Set(topEdgeMatches(t2));
        if (m2.has('UB') && m2.has('UR')) { ky = k; break; }
      }
      ctx.step('2 edge bersebelahan',
        `${uText(bestK)}${yText(ky)}Dua edge yang cocok sekarang di belakang & kanan. Lakukan ${ALG.sune}.`,
        [...uToken(bestK), ...yToken(ky), ...ALG.sune.split(' ')], { alg: ALG.sune });
    } else {
      ctx.step('2 edge berseberangan',
        `${uText(bestK)}Edge yang cocok saling berseberangan. Lakukan ${ALG.sune} sekali, nanti jadi kasus bersebelahan.`,
        [...uToken(bestK), ...ALG.sune.split(' ')], { alg: ALG.sune });
    }
  }
  throw new Error('Edge atas gagal');
}

// ---------- Tahap: posisi sudut atas ----------
function cornerInPlace(ctx, pos) {
  return sameSet(ctx.colors(pos), pos.split('').map((f) => ctx.center(f)));
}

function llCornerPermParity(ctx) {
  // permutasi sudut atas relatif terhadap targetnya
  const idx = U_SLOTS.map((pos) => {
    const cols = ctx.colors(pos);
    return U_SLOTS.findIndex((p2) => sameSet(cols, p2.split('').map((f) => ctx.center(f))));
  });
  if (idx.some((x) => x < 0)) return -1;
  let parity = 0;
  const seen = new Array(4).fill(false);
  for (let i = 0; i < 4; i++) {
    if (seen[i]) continue;
    let j = i; let len = 0;
    while (!seen[j]) { seen[j] = true; j = idx[j]; len++; }
    parity += len - 1;
  }
  return parity % 2;
}

export function stageTopCornersPos(ctx, opts = {}) {
  const top = ctx.center('U');
  ctx.stage('topcornerpos', 'Posisi Sudut Atas',
    `Pindahkan sudut ${ce(top)} ke tempat yang benar (warnanya cocok dengan 3 sisi di sekitarnya, walau masih terpelintir). Rumus: ${ALG.corners}.`,
    ['Cari satu sudut yang sudah di tempat benar, pegang di KANAN-DEPAN-ATAS.', 'Lakukan rumus 1–2 kali sampai semua sudut di tempatnya.', 'Kalau belum ada yang benar, lakukan rumus sekali dari mana saja.']);
  if (opts.free) {
    // 2x2: belum ada edge, lapisan atas bebas diputar — pilih U yang membuat permutasi genap
    let best = null;
    for (let k = 0; k < 4; k++) {
      const t = peek(ctx, uToken(k));
      const par = llCornerPermParity(t);
      const ok = U_SLOTS.filter((p) => cornerInPlace(t, p)).length;
      if (par === 0 && (!best || ok > best.ok)) best = { k, ok };
    }
    if (best && best.k) ctx.step('Atur lapisan atas', `${uText(best.k)}Supaya sudut-sudut atas bisa disusun dengan rumus.`, uToken(best.k));
  }
  let guard = 0;
  while (guard++ < 8) {
    const ok = U_SLOTS.filter((p) => cornerInPlace(ctx, p));
    if (ok.length === 4) return;
    if (ok.length >= 1) {
      const k = U_SLOTS.indexOf(ok[0]);
      ctx.step('Sudut patokan di kanan-depan',
        `${yText(k)}Sudut ${piece(ctx.colors(ok[0]))} sudah di tempat yang benar — jadikan patokan di kanan-depan-atas, lalu ${ALG.corners}.`,
        [...yToken(k), ...ALG.corners.split(' ')], { alg: ALG.corners, focus: ctx.stickers(ok[0]) });
    } else {
      ctx.step('Belum ada sudut yang benar', `Lakukan ${ALG.corners} sekali, nanti minimal satu sudut akan benar.`, ALG.corners, { alg: ALG.corners });
    }
  }
  throw new Error('Posisi sudut gagal');
}

// ---------- Tahap: orientasi sudut atas ----------
export function stageTopCornersTwist(ctx) {
  const top = ctx.center('U');
  ctx.stage('topcornertwist', 'Putar Sudut Atas',
    `Langkah terakhir! Putar tiap sudut sampai ${ce(top)} menghadap atas dengan ${ALG.twist} (diulang 2 atau 4 kali).`,
    ['JANGAN memutar seluruh kubus di tahap ini — hanya sisi atas (U).', 'Lapisan bawah akan terlihat berantakan sementara. Tenang, nanti kembali sendiri!', 'Selalu kerjakan sudut yang ada di kanan-depan-atas.']);
  let guard = 0;
  while (guard++ < 12) {
    const unOri = U_SLOTS.filter((p) => ctx.c(p, 'U') !== top);
    if (!unOri.length) break;
    if (ctx.c('UFR', 'U') === top) {
      let k = 1;
      for (; k < 4; k++) { const t = peek(ctx, uToken(k)); if (t.c('UFR', 'U') !== top) break; }
      ctx.step('Sudut berikutnya', `${uText(k)}Bawa sudut yang belum beres ke kanan-depan-atas. Hanya putar sisi atas!`, uToken(k), { focus: ctx.stickers(U_CORNER_CYCLE[(4 - k) % 4]) });
    }
    let n = 0;
    const probe = peek(ctx, []);
    while (n < 6) { probe.applyRaw(ALG.twist); n++; if (probe.c('UFR', 'U') === top) break; }
    ctx.step(`Putar sudut ${piece(ctx.colors('UFR'))}`,
      `Ulangi ${ALG.twist} sebanyak ${n}x sampai ${ce(top)} di sudut ini menghadap atas.`,
      repeat(ALG.twist, n), { focus: ctx.stickers('UFR'), alg: ALG.twist });
  }
  // selaraskan atas
  for (let k = 0; k < 4; k++) {
    const t = peek(ctx, uToken(k));
    if (U_SLOTS.every((p) => cornerSolvedAt(t, p)) && (ctx.N === 2 || U_EDGES.every((e) => edgeSolvedAt(t, e)))) {
      if (k) ctx.step('Putaran terakhir', `${uText(k)}Selesai! 🎉`, uToken(k));
      return;
    }
  }
  throw new Error('Penyelarasan akhir gagal');
}

export function solveLBL3(ctx, hooks = {}) {
  stageDaisy(ctx);
  stageCross(ctx);
  stageFirstCorners(ctx);
  stageMiddle(ctx);
  stageTopCross(ctx, hooks);
  stageTopEdges(ctx, hooks);
  stageTopCornersPos(ctx);
  stageTopCornersTwist(ctx);
}

export { findCorner, findEdge, cornerSolvedAt, edgeSolvedAt, slotIndexFor, sideIndexOfColor, llCornerPermParity, U_EDGES, U_SLOTS, D_SLOTS, MID_SLOTS, yText, uText };
