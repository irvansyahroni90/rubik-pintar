// Solver kursus 4x4 harus selalu berhasil, dengan urutan tahap yang benar
import * as C from '../src/core/cube.js';
import { solve4Course } from '../src/core/solver/course4.js';
let seed = 404; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const n = Number(process.argv[2] || 20);
let ok = 0, oll = 0, pll = 0, tot = 0, maxMs = 0;
const keys = new Map();
for (let i = 0; i < n; i++) {
  const s = C.applyMoves(C.solvedState(4), 4, C.randomScramble(4, undefined, rng));
  const t0 = Date.now();
  try {
    const r = solve4Course(s);
    maxMs = Math.max(maxMs, Date.now() - t0);
    ok++; tot += r.totalMoves;
    const seq = r.stages.map((x) => x.key).join(' > ');
    keys.set(seq, (keys.get(seq) || 0) + 1);
    const steps = r.stages.flatMap((x) => x.steps);
    if (steps.some((x) => x.meta && x.meta.type === 'ollParity')) oll++;
    if (steps.some((x) => x.meta && x.meta.type === 'pllParity')) pll++;
    // posisi pegang: setelah tahap center1, sisi atas harus putih
    const c1 = r.stages.find((x) => x.key === 'center1');
    const after = C.applyMoves(r.start, 4, r.stages.slice(0, r.stages.indexOf(c1) + 1).flatMap((x) => x.steps.flatMap((y) => y.moves)));
    const top = [5, 6, 9, 10].map((j) => after[j]);
    if (!top.every((c) => c === 0)) { console.log('center putih tidak di atas!'); ok--; }
  } catch (e) { console.log('GAGAL', e.message); }
}
console.log(`kursus 4x4: ok=${ok}/${n} rata2=${(tot / ok).toFixed(0)} gerakan, maks ${maxMs}ms, OLL parity ${oll}x, PLL parity ${pll}x`);
for (const [k, v] of keys) console.log(' ', v, 'x', k);
process.exitCode = ok === n ? 0 : 1;
