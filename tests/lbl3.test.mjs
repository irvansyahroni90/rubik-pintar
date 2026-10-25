import * as C from '../src/core/cube.js';
import { Ctx } from '../src/core/solver/ctx.js';
import { solveLBL3 } from '../src/core/solver/lbl.js';
let seed = 12345; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const n = Number(process.argv[2] || 300);
let ok = 0, fail = 0, tot = 0, maxM = 0; const t0 = Date.now();
for (let i = 0; i < n; i++) {
  const scr = C.randomScramble(3, 25, rng);
  const s = C.applyMoves(C.solvedState(3), 3, scr);
  const ctx = new Ctx(3, s);
  try {
    solveLBL3(ctx);
    const all = ctx.stages.flatMap(st => st.steps.flatMap(x => x.moves));
    const fin = C.applyMoves(s, 3, all);
    if (C.isSolved(fin, 3)) { ok++; const m = C.countMoves(all); tot += m; maxM = Math.max(maxM, m); } else { fail++; console.log('NOT SOLVED', scr.join(' ')); }
  } catch (e) { fail++; console.log('ERR', e.message, scr.join(' ')); }
}
console.log(`LBL3: ok=${ok} fail=${fail} avgMoves=${(tot/ok).toFixed(1)} max=${maxM} time=${Date.now()-t0}ms`);
