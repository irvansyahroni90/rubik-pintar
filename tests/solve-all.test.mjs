import * as C from '../src/core/cube.js';
import { solve, METHODS } from '../src/core/solver/index.js';
let seed = Number(process.env.SEED || 4242); const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const OPP = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4 };
const sizes = (process.argv[2] || '2,3,4,5').split(',').map(Number);
const n = Number(process.argv[3] || 20);
const onlyMethod = process.argv[4];
let failures = 0;
for (const N of sizes) {
  for (const m of METHODS[N]) {
    if (onlyMethod && m.id !== onlyMethod) continue;
    let ok = 0, tot = 0, max = 0, tms = 0, maxms = 0;
    for (let i = 0; i < n; i++) {
      const scr = C.randomScramble(N, undefined, rng);
      const s = C.applyMoves(C.solvedState(N), N, scr);
      const top = Math.floor(rng() * 6);
      const adj = [0,1,2,3,4,5].filter(c => c !== top && c !== OPP[top]);
      const front = adj[Math.floor(rng() * 4)];
      try {
        const r = solve({ N, state: s, method: m.id, top, front });
        ok++; tot += r.totalMoves; max = Math.max(max, r.totalMoves); tms += r.ms; maxms = Math.max(maxms, r.ms);
      } catch (e) { failures++; console.log(`FAIL ${N}x${N} ${m.id}:`, e.message.split('\n')[0], '|', scr.join(' '), 'top', top, 'front', front); }
    }
    console.log(`${N}x${N} ${m.id.padEnd(6)} ok=${ok}/${n} avgMoves=${(tot / Math.max(ok,1)).toFixed(0)} max=${max} avgMs=${(tms / Math.max(ok,1)).toFixed(0)} maxMs=${maxms}`);
  }
}
process.exitCode = failures ? 1 : 0;
