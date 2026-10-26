// Soal latihan: jawaban benar harus konsisten dengan gerakan solusi
import * as C from '../src/core/cube.js';
import { st } from '../src/core/pieces.js';
import { makeQuestion, makeStageDemo, randomCubeYellowTop } from '../src/learn/quiz.js';
import { QUIZ_KEYS, COURSE } from '../src/content/course.js';
let seed = 31; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
let bad = 0;
for (const key of QUIZ_KEYS) {
  const tally = {};
  for (let i = 0; i < 25; i++) {
    const q = makeQuestion(key, rng);
    if (!q) { bad++; console.log('tidak ada soal', key); break; }
    if (!q.options.some((o) => o.id === q.answer)) { bad++; console.log('jawaban tak ada di opsi', key, q.answer); }
    if (q.state.length !== 54 || !q.moves.length) { bad++; console.log('state/moves aneh', key); }
    tally[String(q.answer)] = (tally[String(q.answer)] || 0) + 1;
  }
  console.log(key.padEnd(15), JSON.stringify(tally));
}
for (const L of COURSE.filter((l) => l.key)) {
  const d = makeStageDemo(L.key, rng);
  if (!d) { bad++; console.log('tidak ada contoh', L.key); continue; }
  const end = C.applyMoves(d.start, 3, d.stages[0].steps.flatMap((s) => s.moves));
  console.log('contoh', L.key.padEnd(15), d.totalMoves, 'gerakan');
  void end;
}
const r = randomCubeYellowTop(rng);
console.log('kubus acak: kuning atas', r[st(3, 'U', 'U')] === 1, 'hijau depan', r[st(3, 'F', 'F')] === 4);
process.exitCode = bad ? 1 : 0;
