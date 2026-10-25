import * as C from '../src/core/cube.js';
import { classifyAll } from '../src/scan/colors.js';
let seed = 3; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const BASE = [[225, 228, 222], [235, 200, 35], [185, 30, 40], [235, 105, 25], [25, 160, 80], [25, 80, 195]];
for (const N of [2, 3, 4, 5]) {
  let wrong = 0, total = 0;
  for (let t = 0; t < 30; t++) {
    const s = C.applyMoves(C.solvedState(N), N, C.randomScramble(N, undefined, rng));
    const light = [0, 1, 2, 3, 4, 5].map(() => 0.7 + rng() * 0.45); // pencahayaan berbeda tiap foto
    const warm = [0, 1, 2, 3, 4, 5].map(() => (rng() - 0.5) * 30);
    const samples = Array.from(s).map((c, i) => {
      const f = Math.floor(i / (N * N));
      return BASE[c].map((v, k) => Math.max(0, Math.min(255, v * light[f] + (k === 0 ? warm[f] : k === 2 ? -warm[f] : 0) + (rng() - 0.5) * 30)));
    });
    const lab = classifyAll(samples, N);
    lab.forEach((c, i) => { total++; if (c !== s[i]) wrong++; });
  }
  console.log(`N=${N}: salah ${wrong}/${total} (${(100 * wrong / total).toFixed(2)}%)`);
}
