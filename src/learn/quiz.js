// Soal latihan "kalau begini, apa yang kamu lakukan?" dari kubus acak sungguhan.
// Kubus diacak, diselesaikan dengan metode pemula, lalu diambil satu situasi dari tahap yang dipelajari.
import { applyMoves, randomScramble, solvedState, countMoves } from '../core/cube.js';
import { solve } from '../core/solver/index.js';
import { st, uToken } from '../core/pieces.js';

const TYPE = {
  cross: 'crossFace', corners1: 'sexyCount', middle: 'middleSide', topcross: 'topCross',
  topedges: 'topEdges', topcornerpos: 'cornerAnchor', topcornertwist: 'twistCount',
};
const SIDE_NAME = { F: 'Depan', R: 'Kanan', B: 'Belakang', L: 'Kiri' };
const COLOR_NAME = ['putih', 'kuning', 'merah', 'oranye', 'hijau', 'biru'];
const CORNER_NAME = { UFR: 'Kanan-depan', UBR: 'Kanan-belakang', UBL: 'Kiri-belakang', UFL: 'Kiri-depan' };

function solveRandom(rng) {
  const scr = randomScramble(3, 25, rng);
  const state = applyMoves(solvedState(3), 3, scr);
  // pegang kuning di atas, hijau di depan — sama seperti di kursus
  return solve({ N: 3, state, method: 'lbl', top: 1, front: 4, capture: true });
}

// Untuk tahap yang jawabannya jarang muncul, coba cari jawaban yang bervariasi
const BALANCE = { topcross: ['dot', 'L', 'line'], topedges: ['adjacent', 'opposite'] };

export function makeQuestion(key, rng = Math.random) {
  const want = BALANCE[key] ? BALANCE[key][Math.floor(rng() * BALANCE[key].length)] : undefined;
  let fallback = null;
  for (let tries = 0; tries < 40; tries++) {
    const r = solveRandom(rng);
    const stage = r.stages.find((s) => s.key === key);
    if (!stage) continue;
    let steps = stage.steps.filter((s) => s.meta && s.meta.type === TYPE[key]);
    if (key === 'topcornertwist') steps = steps.slice(0, 1); // sudut pertama: bagian bawah masih rapi
    if (!steps.length) continue;
    if (want !== undefined) {
      const hit = steps.find((x) => (key === 'topcross' ? x.meta.pattern : x.meta.kind) === want);
      if (!hit) { if (!fallback) fallback = build(key, steps[0]); continue; }
      return build(key, hit);
    }
    const step = steps[Math.floor(rng() * steps.length)];
    const q = build(key, step);
    if (q) return q;
  }
  return fallback;
}

function build(key, step) {
  const m = step.meta;
  const before = step.before;
  const base = { state: before, focus: step.focus || [], moves: step.moves, stepText: step.text };
  switch (key) {
    case 'cross': {
      const colorOf = (f) => before[st(3, f, f)];
      return {
        ...base,
        prompt: 'Kelopak yang menyala harus diturunkan di sisi mana?',
        options: ['F', 'R', 'B', 'L'].map((f) => ({ id: f, label: SIDE_NAME[f], color: colorOf(f) })),
        answer: m.face,
        explain: `Warna samping kelopak itu ${COLOR_NAME[m.color]}, jadi tujuannya sisi yang tengahnya ${COLOR_NAME[m.color]} (${SIDE_NAME[m.face].toLowerCase()}). ${m.k ? 'Putar U dulu sampai sejajar, lalu' : 'Sudah sejajar, langsung'} putar sisi itu 2x.`,
      };
    }
    case 'corners1': {
      const white = before[st(3, 'D', 'D')];
      const face = ['U', 'F', 'R'].find((f) => before[st(3, 'UFR', f)] === white);
      const where = { U: 'ke atas', F: 'ke depan', R: 'ke kanan' }[face];
      return {
        ...base,
        prompt: 'Sudut yang menyala sudah di atas slotnya. Berapa kali R U R\' U\'?',
        options: [1, 3, 5].map((n) => ({ id: n, label: `${n}x` })),
        answer: m.n,
        explain: `Putih sudut itu menghadap ${where}: kanan = 1x, atas = 3x, depan = 5x.`,
      };
    }
    case 'middle':
      return {
        ...base,
        prompt: 'Edge yang menyala sudah membentuk T. Pakai rumus mana?',
        options: [{ id: true, label: 'Rumus kanan' }, { id: false, label: 'Rumus kiri' }],
        answer: m.right,
        explain: `Warna atas edge sama dengan tengah ${m.right ? 'KANAN' : 'KIRI'}, jadi edge harus masuk ke ${m.right ? 'kanan' : 'kiri'}.`,
      };
    case 'topcross':
      return {
        ...base,
        prompt: 'Pola kuning di atas ini (abaikan sudut) namanya apa?',
        options: [{ id: 'dot', label: 'Titik' }, { id: 'L', label: 'Huruf L' }, { id: 'line', label: 'Garis' }],
        answer: m.pattern,
        explain: {
          dot: 'Hanya tengahnya yang kuning. Lakukan F R U R\' U\' F\' dari posisi mana saja.',
          L: 'Dua edge kuning bersebelahan. Pegang L di kiri-belakang, lalu F R U R\' U\' F\'.',
          line: 'Dua edge kuning segaris. Pegang garis mendatar, lalu F R U R\' U\' F\'.',
        }[m.pattern],
      };
    case 'topedges': {
      const pre = uToken(m.pre);
      return {
        ...base,
        state: Array.from(applyMoves(before, 3, pre)),
        focus: [],
        moves: step.moves.slice(pre.length),
        prompt: 'Lapisan atas sudah diputar ke posisi terbaik. Dua edge yang warna sampingnya cocok itu…',
        options: [{ id: 'adjacent', label: 'Bersebelahan' }, { id: 'opposite', label: 'Berseberangan' }],
        answer: m.kind,
        explain: m.kind === 'adjacent'
          ? 'Bersebelahan: pegang keduanya di belakang & kanan, lalu R U R\' U R U2 R\' U.'
          : 'Berseberangan: lakukan R U R\' U R U2 R\' U sekali, nanti jadi bersebelahan.',
      };
    }
    case 'topcornerpos':
      return {
        ...base,
        focus: [],
        prompt: 'Sudut atas mana yang sudah di tempat yang benar (3 warnanya cocok dengan tengah di sekitarnya)?',
        options: [...Object.entries(CORNER_NAME).map(([id, label]) => ({ id, label })), { id: null, label: 'Belum ada' }],
        answer: m.anchor,
        explain: m.anchor
          ? `Sudut ${CORNER_NAME[m.anchor].toLowerCase()} sudah benar. Hadapkan ke kanan-depan, lalu U R U' L' U R' U' L.`
          : 'Belum ada yang benar. Lakukan rumusnya sekali, nanti satu sudut akan benar.',
      };
    case 'topcornertwist': {
      const yel = before[st(3, 'U', 'U')];
      const face = ['F', 'R'].find((f) => before[st(3, 'UFR', f)] === yel);
      return {
        ...base,
        prompt: 'Berapa kali R\' D\' R D untuk sudut kanan-depan-atas yang menyala?',
        options: [2, 4].map((n) => ({ id: n, label: `${n}x` })),
        answer: m.n,
        explain: `Kuning sudut itu menghadap ${face === 'R' ? 'kanan → 2x' : 'depan → 4x'}.`,
      };
    }
    default:
      return null;
  }
}

// Contoh satu tahap dari kubus acak, untuk diputar di Player
export function makeStageDemo(key, rng = Math.random) {
  for (let tries = 0; tries < 20; tries++) {
    const r = solveRandom(rng);
    const stage = r.stages.find((s) => s.key === key);
    if (!stage || !stage.steps.length || !stage.steps[0].before) continue;
    const moves = stage.steps.flatMap((s) => s.moves);
    if (moves.length < 4) continue;
    const clean = { ...stage, steps: stage.steps.map(({ before, ...rest }) => rest) };
    return {
      N: 3, method: 'lbl', top: 1, front: 4, scheme: null,
      start: stage.steps[0].before,
      stages: [clean],
      totalMoves: countMoves(moves),
      stageOnly: stage.title,
    };
  }
  return null;
}

// Kubus acak untuk pelajaran pertama (kuning di atas, hijau di depan)
export function randomCubeYellowTop(rng = Math.random) {
  const s = applyMoves(solvedState(3), 3, randomScramble(3, 25, rng));
  // putar seluruh kubus sampai tengah kuning di atas & hijau di depan
  const rots = ['', 'x', "x'", 'x2', 'z', "z'"];
  const ys = ['', 'y', "y'", 'y2'];
  for (const a of rots) for (const b of ys) {
    const t = applyMoves(s, 3, [a, b].filter(Boolean));
    if (t[st(3, 'U', 'U')] === 1 && t[st(3, 'F', 'F')] === 4) return Array.from(t);
  }
  return Array.from(s);
}
