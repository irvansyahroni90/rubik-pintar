// Kuis & contoh untuk Kursus 4x4 (dari kubus 4x4 acak sungguhan)
import { applyMoves, randomScramble, solvedState, countMoves, parseAlg } from '../core/cube.js';
import { solve4Course } from '../core/solver/course4.js';
import { groupN, baseN, maskN, trackN } from './build.js';

const COLOR_NAME = ['putih', 'kuning', 'merah', 'oranye', 'hijau', 'biru'];
const FACE = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const centerColor = (s, f) => s[groupN(4, `centers:${f}`)[0]];

function solveRandom(rng) {
  const s = applyMoves(solvedState(4), 4, randomScramble(4, undefined, rng));
  return solve4Course(s);
}

// ---------- Kuis urutan warna center ----------
const ROTS = ['', 'x', "x'", 'x2', 'z', "z'"];
const YS = ['', 'y', "y'", 'y2'];
function schemeQuestion(rng) {
  const rot = [ROTS[Math.floor(rng() * ROTS.length)], YS[Math.floor(rng() * YS.length)]].filter(Boolean);
  const full = Array.from(applyMoves(baseN(4, 'Y'), 4, rot));
  const ask = ['R', 'B', 'L'][Math.floor(rng() * 3)];
  const askName = { R: 'KANAN', B: 'BELAKANG', L: 'KIRI' }[ask];
  const top = centerColor(full, 'U'); const front = centerColor(full, 'F');
  const shown = maskN(4, full, ['centers:U', 'centers:F']);
  const answer = centerColor(full, ask);
  const options = [0, 1, 2, 3, 4, 5].filter((c) => c !== top && c !== front).map((c) => ({ id: c, label: COLOR_NAME[c][0].toUpperCase() + COLOR_NAME[c].slice(1), color: c }));
  const order = ['F', 'R', 'B', 'L'].map((f) => COLOR_NAME[centerColor(full, f)]).join(' → ');
  return {
    N: 4,
    state: shown,
    reveal: maskN(4, full, ['centers']),
    focus: [],
    moves: [],
    prompt: `Atas ${COLOR_NAME[top]}, depan ${COLOR_NAME[front]}. Center di sisi ${askName} harus warna apa?`,
    options,
    answer,
    explain: `Berseberangan selalu: putih–kuning, merah–oranye, hijau–biru. Dengan atas ${COLOR_NAME[top]}, urutan sisi samping (depan → kanan → belakang → kiri) adalah ${order}.`,
  };
}

// ---------- Kuis arah lapisan dalam saat memasangkan edge ----------
function edgeQuestion(rng) {
  for (let tries = 0; tries < 20; tries++) {
    const r = solveRandom(rng);
    const stage = r.stages.find((x) => x.key === 'edges');
    const steps = stage.steps.filter((x) => x.parts && x.meta && !x.meta.last);
    const cands = steps.filter((x) => {
      const slice = x.moves[x.parts[0].label.startsWith('Siapkan') ? x.parts[0].n : 0];
      return ['2U', "2U'", '2D', "2D'"].includes(slice);
    });
    if (!cands.length) continue;
    const step = cands[Math.floor(rng() * cands.length)];
    const nSetup = step.parts[0].label.startsWith('Siapkan') ? step.parts[0].n : 0;
    const setup = step.moves.slice(0, nSetup);
    const slice = step.moves[nSetup];
    return {
      N: 4,
      state: Array.from(applyMoves(step.before, 4, setup)),
      focus: trackN(4, step.focus || [], setup),
      moves: step.moves.slice(nSetup),
      prompt: 'Dua keping yang menyala sudah siap. Lapisan dalam mana yang menyatukannya di kanan-depan?',
      options: ['2U', "2U'", '2D', "2D'"].map((m) => ({ id: m, label: m })),
      answer: slice,
      explain: `${slice} memutar lapisan dalam ${slice.startsWith('2U') ? 'atas' : 'bawah'} ${slice.endsWith("'") ? (slice.startsWith('2U') ? 'ke kanan' : 'ke kiri') : (slice.startsWith('2U') ? 'ke kiri' : 'ke kanan')}, sehingga keping yang bergerak berhenti tepat di samping pasangannya di kanan-depan. Setelah itu: keluarkan, lalu kembalikan lapisan dalam.`,
    };
  }
  return null;
}

// ---------- Kuis OLL parity ----------
function ollQuestion(rng) {
  const want = rng() < 0.5;
  let fallback = null;
  for (let tries = 0; tries < 30; tries++) {
    const r = solveRandom(rng);
    const stage = r.stages.find((x) => x.key === 'topcross');
    if (!stage || !stage.steps.length) continue;
    const first = stage.steps[0];
    const has = stage.steps.some((x) => x.meta && x.meta.type === 'ollParity');
    const st = first.before;
    const up = ['UF', 'UR', 'UB', 'UL'].filter((e) => groupN(4, `edge:${e}`).filter((i) => Math.floor(i / 16) === FACE.U).every((i) => st[i] === st[groupN(4, 'centers:U')[0]])).length;
    const q = {
      N: 4,
      state: st,
      focus: [],
      moves: first.moves,
      prompt: 'Tahap Silang Kuning. Hitung edge yang kuningnya menghadap atas (abaikan sudut). Perlu OLL parity?',
      options: [{ id: true, label: 'Ya, perlu parity' }, { id: false, label: 'Tidak, lanjut biasa' }],
      answer: has,
      explain: has
        ? `Ada ${up} edge kuning di atas — ganjil, jadi OLL parity. Pegang edge yang tidak kuning di depan-atas, lalu rumus parity.`
        : `Ada ${up} edge kuning di atas — genap, jadi tidak perlu parity. Lanjut dengan F R U R' U' F'.`,
    };
    if (has === want) return q;
    if (!fallback) fallback = q;
  }
  return fallback;
}

export function makeQuestion4(key, rng = Math.random) {
  if (key === 'centers4') return schemeQuestion(rng);
  if (key === 'edges') return edgeQuestion(rng);
  if (key === 'ollparity') return ollQuestion(rng);
  return null;
}

// ---------- Contoh tahap dari kubus acak ----------
const GROUP = {
  center1: ['center1'], center2: ['flip', 'center2'], centers4: ['centers4'], edges: ['edges'], lastedges: ['edges'],
  solve3: ['daisy', 'cross', 'corners1', 'middle', 'topcross', 'topedges', 'topcornerpos', 'topcornertwist'],
  ollparity: ['topcross'], pllparity: ['topedges'],
};
const TITLE = { solve3: 'seperti 3x3', lastedges: 'Dua Edge Terakhir' };

export function makeStageDemo4(key, rng = Math.random) {
  for (let tries = 0; tries < 30; tries++) {
    const r = solveRandom(rng);
    let stages = r.stages.filter((x) => GROUP[key].includes(x.key));
    if (!stages.length) continue;
    if (key === 'ollparity' && !stages[0].steps.some((x) => x.meta && x.meta.type === 'ollParity')) continue;
    if (key === 'pllparity' && !stages[0].steps.some((x) => x.meta && x.meta.type === 'pllParity')) continue;
    if (key === 'lastedges') {
      const steps = stages[0].steps;
      const from = Math.max(0, steps.length - 2);
      stages = [{ ...stages[0], title: 'Dua Edge Terakhir', steps: steps.slice(from) }];
    }
    const first = stages[0].steps[0];
    if (!first || !first.before) continue;
    const moves = stages.flatMap((x) => x.steps.flatMap((y) => y.moves));
    if (moves.length < 2) continue;
    const clean = stages.map((x) => ({ ...x, steps: x.steps.map(({ before, ...rest }) => rest) }));
    return {
      N: 4, method: 'lbl', top: 1, front: 4,
      scheme: key === 'center1' || key === 'center2' ? r.scheme : r.scheme1,
      start: first.before,
      stages: clean,
      totalMoves: countMoves(moves),
      stageOnly: TITLE[key] || stages[0].title,
    };
  }
  return null;
}

export function randomCube4(rng = Math.random) {
  return Array.from(applyMoves(solvedState(4), 4, randomScramble(4, undefined, rng)));
}

export { parseAlg };
