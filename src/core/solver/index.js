// Titik masuk solver: memilih metode sesuai ukuran & membuat rencana langkah demi langkah
import { applyMoves, isSolved, countMoves, parseAlg } from '../cube.js';
import { validate, schemeFrom, orientationMoves, centerColors } from '../scheme.js';
import { Ctx, ce, cn } from './ctx.js';
import { solveLBL3, stageDaisy, stageCross, stageFirstCorners, stageMiddle, stageTopCross, stageTopEdges, stageTopCornersPos, stageTopCornersTwist } from './lbl.js';
import { solveCFOP3, stageCrossCFOP, stageF2L, stageOLL, stagePLL } from './cfop.js';
import { solve2LBL, solve2Ortega } from './two.js';
import { stageCenters, stageEdges, parityHooks } from './bigcube.js';

export const METHODS = {
  2: [
    { id: 'lbl', name: 'Pemula (Lapisan)', level: 'Pemula', desc: '3 tahap, 3 rumus. Paling mudah dipelajari.' },
    { id: 'ortega', name: 'Ortega', level: 'Menengah', desc: 'Sisi → OLL → PBL. Lebih cepat, ±12 rumus.' },
  ],
  3: [
    { id: 'lbl', name: 'Pemula (Lapisan)', level: 'Pemula', desc: '8 tahap, 7 rumus pendek. Cocok untuk pertama kali.' },
    { id: 'cfop2', name: 'CFOP 4-Look', level: 'Menengah', desc: 'Cross, F2L intuitif, 2-look OLL & PLL (16 rumus).' },
    { id: 'cfop', name: 'CFOP Penuh', level: 'Mahir', desc: 'Cross, F2L, OLL 57 + PLL 21. Metode para speedcuber.' },
  ],
  4: [
    { id: 'lbl', name: 'Reduksi + Pemula', level: 'Pemula', desc: 'Center → pasangkan edge → selesaikan seperti 3x3 pemula (+ parity).' },
    { id: 'cfop2', name: 'Reduksi + CFOP 4-Look', level: 'Menengah', desc: 'Tahap 3x3 memakai CFOP 4-look.' },
    { id: 'cfop', name: 'Reduksi + CFOP Penuh', level: 'Mahir', desc: 'Tahap 3x3 memakai OLL & PLL penuh.' },
  ],
  5: [
    { id: 'lbl', name: 'Reduksi + Pemula', level: 'Pemula', desc: 'Center → pasangkan edge → selesaikan seperti 3x3 pemula.' },
    { id: 'cfop2', name: 'Reduksi + CFOP 4-Look', level: 'Menengah', desc: 'Tahap 3x3 memakai CFOP 4-look.' },
    { id: 'cfop', name: 'Reduksi + CFOP Penuh', level: 'Mahir', desc: 'Tahap 3x3 memakai OLL & PLL penuh.' },
  ],
};

const FACE_WORD = { U: 'atas', F: 'depan' };

function solve3Stage(ctx, method, hooks) {
  if (method === 'lbl') {
    stageDaisy(ctx); stageCross(ctx); stageFirstCorners(ctx); stageMiddle(ctx);
    stageTopCross(ctx, hooks); stageTopEdges(ctx, hooks); stageTopCornersPos(ctx); stageTopCornersTwist(ctx);
  } else {
    const full = method === 'cfop';
    stageCrossCFOP(ctx); stageF2L(ctx); stageOLL(ctx, full, hooks); stagePLL(ctx, full, hooks);
  }
}

/**
 * @param {{N:number, state:Uint8Array|number[], method:string, top:number, front:number}} opts
 */
export function solve(opts) {
  const { N, method = 'lbl', top, front } = opts;
  const state = Uint8Array.from(opts.state);
  const v = validate(state, N);
  if (!v.ok) { const e = new Error(v.errors.join('\n')); e.validation = v.errors; throw e; }
  const t0 = Date.now();
  let ctx;
  let scheme;
  if (N % 2 === 1) {
    ctx = new Ctx(N, state, { capture: !!opts.capture });
    const rot = orientationMoves(state, N, top, front);
    ctx.stage('hold', 'Pegang Kubus', `Pegang kubus dengan tengah ${ce(top)} ${cn(top)} di ATAS dan ${ce(front)} ${cn(front)} MENGHADAPMU. Semua gerakan dibaca dari sudut pandang ini.`, ['Huruf besar (R, U, F…) = sisi diputar searah jarum jam bila kamu melihat sisi itu langsung.', "Tanda ' (aksen) = berlawanan arah jarum jam. Angka 2 = putar 2x."]);
    if (rot.length) ctx.step('Atur arah pegang', `Putar seluruh kubus (${rot.join(' ')}) sampai ${ce(top)} di atas dan ${ce(front)} di depan.`, rot);
    else ctx.note('Arah pegang sudah pas', `${ce(top)} sudah di atas dan ${ce(front)} di depan. Langsung mulai!`);
    scheme = centerColors(ctx.state, N);
  } else {
    scheme = schemeFrom(state, N, top, front);
    ctx = new Ctx(N, state, N === 2 ? { virtualCenters: scheme } : {});
    ctx.stage('hold', 'Pegang Kubus', `Pegang kubus seperti saat foto pertama (sisi DEPAN menghadapmu, sisi ATAS di atas). Kubus ${N}x${N} tidak punya center tetap, jadi warnanya ditentukan pilihanmu: atas ${ce(top)}, depan ${ce(front)}.`, ['Jangan memutar seluruh kubus kecuali diminta (huruf x, y, z).']);
    ctx.note('Siap', `Hasil akhirnya: atas ${ce(scheme[0])}, depan ${ce(scheme[2])}, kanan ${ce(scheme[1])}, bawah ${ce(scheme[3])}, kiri ${ce(scheme[4])}, belakang ${ce(scheme[5])}.`);
  }

  if (N === 2) {
    if (method === 'ortega') solve2Ortega(ctx); else solve2LBL(ctx);
  } else if (N === 3) {
    solve3Stage(ctx, method, {});
  } else {
    stageCenters(ctx, scheme);
    stageEdges(ctx, scheme);
    solve3Stage(ctx, method, parityHooks(N));
  }

  const all = ctx.stages.flatMap((s) => s.steps.flatMap((x) => x.moves));
  const fin = applyMoves(state, N, all);
  if (!isSolved(fin, N)) throw new Error('Solusi tidak berhasil diverifikasi — kemungkinan ada kesalahan scan.');
  // ringkas: buang tahap kosong, hitung gerakan
  const stages = ctx.stages.filter((s) => s.steps.length).map((s) => ({ ...s, moveCount: countMoves(s.steps.flatMap((x) => x.moves)) }));
  return {
    N, method, top, front, scheme,
    start: Array.from(state),
    stages,
    totalMoves: countMoves(all),
    ms: Date.now() - t0,
  };
}

export { validate, parseAlg, FACE_WORD };
