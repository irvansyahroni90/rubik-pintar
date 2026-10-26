// Solver 4x4 untuk KURSUS: urutannya sama dengan yang diajarkan di pelajaran.
// 1) Center putih di ATAS  2) balik kubus (z2)  3) center kuning di atas  4) 4 center samping
// 5) pasangkan edge  6) selesaikan seperti 3x3 (metode pemula) + OLL/PLL parity
import { applyMoves, isSolved, countMoves } from '../cube.js';
import { validate, schemeFrom } from '../scheme.js';
import { Ctx, ce } from './ctx.js';
import { stageCenters, stageEdges, parityHooks } from './bigcube.js';
import { stageDaisy, stageCross, stageFirstCorners, stageMiddle, stageTopCross, stageTopEdges, stageTopCornersPos, stageTopCornersTwist } from './lbl.js';

export const WHITE = 0;
export const YELLOW = 1;
export const GREEN = 4;

// skema warna setelah seluruh kubus diputar z2 (atas↔bawah, kanan↔kiri)
export const rotZ2 = (s) => [s[3], s[4], s[2], s[0], s[1], s[5]];

export function solve4Course(state) {
  const N = 4;
  const start = Uint8Array.from(state);
  const v = validate(start, N);
  if (!v.ok) { const e = new Error(v.errors.join('\n')); e.validation = v.errors; throw e; }
  const scheme0 = schemeFrom(start, N, WHITE, GREEN);
  const ctx = new Ctx(N, start, { capture: true });

  stageCenters(ctx, scheme0, {
    key: 'center1', title: 'Center Putih', faces: [0],
    intro: `Kumpulkan 4 keping center ${ce(WHITE)} putih di sisi ATAS. Kubus belum punya center lain, jadi bebas memakai lapisan dalam (2R, 2L, …).`,
    tips: ['Buat "bar" (2 keping berdampingan) lalu naikkan bersama.', 'Putar sisi atas (U) untuk menggeser slot kosong.'],
  });
  ctx.stage('flip', 'Balik Kubus', 'Center putih sudah jadi. Balik kubus seperti memutar setir 180° (z2): putih ke bawah, kuning ke atas, hijau tetap di depan.', []);
  ctx.step('Balik kubus (z2)', `Putar seluruh kubus 180° seperti setir: ${ce(WHITE)} putih sekarang di BAWAH. Center kuning akan dibangun di atas.`, 'z2');
  const scheme1 = rotZ2(scheme0);

  stageCenters(ctx, scheme1, {
    key: 'center2', title: 'Center Kuning', faces: [0], done: [3],
    intro: `Kumpulkan 4 keping ${ce(YELLOW)} kuning di atas tanpa merusak center putih di bawah. Setiap putaran lapisan dalam harus dikembalikan.`,
    tips: ['Pola dasar: 2R U2 2R\' atau 2R U 2R\'.', 'Putar F untuk membawa keping ke kolom kanan-dalam.'],
  });
  stageCenters(ctx, scheme1, {
    key: 'centers4', title: '4 Center Samping', faces: [2, 1, 5, 4], done: [0, 3],
    intro: `Lengkapi center samping dengan urutan warna yang benar: depan ${ce(scheme1[2])}, kanan ${ce(scheme1[1])}, belakang ${ce(scheme1[5])}, kiri ${ce(scheme1[4])}.`,
    tips: ['Kuning atas & hijau depan → oranye di kanan, biru di belakang, merah di kiri.', 'Lapisan dalam horizontal (2U, 2D) memindahkan keping antar sisi samping tanpa mengganggu atas & bawah.'],
  });
  stageEdges(ctx, scheme1);
  const hooks = parityHooks(N);
  stageDaisy(ctx); stageCross(ctx); stageFirstCorners(ctx); stageMiddle(ctx);
  stageTopCross(ctx, hooks); stageTopEdges(ctx, hooks); stageTopCornersPos(ctx); stageTopCornersTwist(ctx);

  const all = ctx.stages.flatMap((s) => s.steps.flatMap((x) => x.moves));
  if (!isSolved(applyMoves(start, N, all), N)) throw new Error('Solusi kursus 4x4 tidak terverifikasi');
  const stages = ctx.stages.filter((s) => s.steps.length).map((s) => ({ ...s, moveCount: countMoves(s.steps.flatMap((x) => x.moves)) }));
  return { N, method: 'lbl', top: YELLOW, front: GREEN, scheme: scheme0, scheme1, start: Array.from(start), stages, totalMoves: countMoves(all) };
}
