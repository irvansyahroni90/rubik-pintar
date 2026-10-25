import * as C from '../src/core/cube.js';
import { Ctx } from '../src/core/solver/ctx.js';
import { solveCFOP3, initF2L } from '../src/core/solver/cfop.js';
let seed = 777; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const F2 = initF2L();
console.log('triggers kept:', F2.trig.map(t=>t.alg).join(' | '));
let unreachable=0; for (let i=0;i<576;i++){ const c=Math.floor(i/24), e=i%24; if (F2.dist[i]===Infinity) unreachable++; }
console.log('f2l states unreachable (incl illegal):', unreachable);
for (const full of [false, true]) {
  const n = Number(process.argv[2] || 300);
  let ok = 0, fail = 0, tot = 0, maxM = 0; const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const scr = C.randomScramble(3, 25, rng);
    const s = C.applyMoves(C.solvedState(3), 3, scr);
    const ctx = new Ctx(3, s);
    try {
      solveCFOP3(ctx, full);
      const all = ctx.stages.flatMap(st => st.steps.flatMap(x => x.moves));
      if (C.isSolved(C.applyMoves(s, 3, all), 3)) { ok++; const m = C.countMoves(all); tot += m; maxM = Math.max(maxM, m); } else { fail++; console.log('NOT SOLVED', scr.join(' ')); }
    } catch (e) { fail++; console.log('ERR', e.message, scr.join(' ')); }
  }
  console.log(`CFOP full=${full}: ok=${ok} fail=${fail} avgMoves=${(tot/ok).toFixed(1)} max=${maxM} time=${Date.now()-t0}ms`);
}
