import * as C from '../src/core/cube.js';
import { validate } from '../src/core/scheme.js';
import { st } from '../src/core/pieces.js';
let seed = 5; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
let bad = 0;
for (const N of [2, 3, 4, 5]) {
  let okCount = 0, caught = 0, total = 0;
  for (let i = 0; i < 40; i++) {
    const s = C.applyMoves(C.solvedState(N), N, C.randomScramble(N, undefined, rng));
    if (validate(s, N).ok) okCount++; else { bad++; console.log('valid state rejected', N, validate(s, N).errors); }
    // twist one corner
    const t = Uint8Array.from(s);
    const a = st(N, 'UFR', 'U'), b = st(N, 'UFR', 'R'), c = st(N, 'UFR', 'F');
    [t[a], t[b], t[c]] = [t[c], t[a], t[b]];
    total++; if (!validate(t, N).ok) caught++;
    // swap two stickers of different colors
    const u = Uint8Array.from(s); let x = 0, y = 1; while (u[x] === u[y]) y++;
    [u[x], u[y]] = [u[y], u[x]];
    if (N !== 4 && N !== 2) { total++; if (!validate(u, N).ok) caught++; }
    if (N === 3) { const v = Uint8Array.from(s); const p = st(3,'UF','U'), q = st(3,'UF','F'); [v[p], v[q]] = [v[q], v[p]]; total++; if (!validate(v, 3).ok) caught++; }
  }
  console.log(`N=${N} valid ok ${okCount}/40, corrupted caught ${caught}/${total}`);
}
process.exitCode = bad ? 1 : 0;
