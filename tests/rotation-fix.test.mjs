// Sisi yang terfoto terputar harus terdeteksi dan dibetulkan otomatis
import * as C from '../src/core/cube.js';
import { validate, rotateFace, findRotationFix } from '../src/core/scheme.js';
let seed = 77; const rng = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const n = Number(process.argv[2] || 40);
let bad = 0;
for (const N of [2, 3, 4, 5]) {
  let fixed = 0, undetected = 0, wrong = 0, none = 0, tmax = 0;
  for (let i = 0; i < n; i++) {
    const s = Array.from(C.applyMoves(C.solvedState(N), N, C.randomScramble(N, undefined, rng)));
    // 1-2 sisi terputar (paling sering: atas/bawah)
    const k = 1 + Math.floor(rng() * 2);
    let t = s;
    const faces = k === 1 ? [[0, 3][Math.floor(rng() * 2)]] : [0, 3];
    for (const f of faces) t = rotateFace(t, N, f, rng() < 0.5 ? 1 : -1);
    if (validate(t, N).ok) { undetected++; continue; }
    const t0 = Date.now();
    const r = findRotationFix(t, N);
    tmax = Math.max(tmax, Date.now() - t0);
    if (!r) { none++; continue; }
    if (r.state.every((v, j) => v === s[j])) fixed++; else wrong++;
  }
  // kasus tanpa solusi (stiker tertukar acak) — ukur waktu terburuk
  const s = Array.from(C.applyMoves(C.solvedState(N), N, C.randomScramble(N, undefined, rng)));
  let x = 0, y = 1; while (s[x] === s[y]) y++;
  [s[x], s[y]] = [s[y], s[x]];
  const t0 = Date.now(); const r = findRotationFix(s, N); const worst = Date.now() - t0;
  console.log(`N=${N}: dibetulkan ${fixed}/${n}, salah-fix ${wrong}, tak-terdeteksi ${undetected}, tak-ketemu ${none}, maks ${tmax}ms, kasus tanpa solusi ${worst}ms (${r ? 'ADA FIX?!' : 'null'})`);
  if (wrong || none) bad++;
}
process.exitCode = bad ? 1 : 0;
