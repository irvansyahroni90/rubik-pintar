// Kuis & contoh Kursus 4x4
import * as C from '../src/core/cube.js';
import { makeQuestion4, makeStageDemo4, randomCube4 } from '../src/learn/quiz4.js';
import { QUIZ_KEYS4, COURSE4 } from '../src/content/course4.js';
let seed = 44; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
let bad = 0;
for (const key of QUIZ_KEYS4) {
  const tally = {};
  const t0 = Date.now();
  for (let i = 0; i < 12; i++) {
    const q = makeQuestion4(key, rng);
    if (!q) { bad++; console.log('tidak ada soal', key); break; }
    if (!q.options.some((o) => o.id === q.answer)) { bad++; console.log('jawaban tak ada di opsi', key, q.answer); }
    if (q.state.length !== 96) { bad++; console.log('state aneh', key); }
    // jawaban harus konsisten: memutar "moves" dari state tidak error
    C.applyMoves(q.state, 4, q.moves);
    tally[String(q.answer)] = (tally[String(q.answer)] || 0) + 1;
  }
  console.log(key.padEnd(10), JSON.stringify(tally), `${((Date.now() - t0) / 12).toFixed(0)}ms/soal`);
}
for (const L of COURSE4.filter((l) => l.key)) {
  const t0 = Date.now();
  const d = makeStageDemo4(L.key, rng);
  if (!d) { bad++; console.log('tidak ada contoh', L.key); continue; }
  const end = C.applyMoves(d.start, 4, d.stages.flatMap((s) => s.steps.flatMap((x) => x.moves)));
  void end;
  console.log('contoh', L.key.padEnd(10), d.stages.map((s) => s.key).join('+'), d.totalMoves, 'gerakan', `${Date.now() - t0}ms`);
}
console.log('kubus acak 4x4:', randomCube4(rng).length === 96);
process.exitCode = bad ? 1 : 0;
