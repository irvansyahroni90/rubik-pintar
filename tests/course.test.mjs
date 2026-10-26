// Semua animasi kasus di kursus harus benar-benar menghasilkan yang dijelaskan
import * as C from '../src/core/cube.js';
import { st, sameSet } from '../src/core/pieces.js';
import { BASE, buildState, caseMoves } from '../src/learn/build.js';
import { COURSE } from '../src/content/course.js';
const A = (s, m) => Array.from(C.applyMoves(s, 3, m));
const solvedP = (s, p) => p.split('').every((f) => s[st(3, p, f)] === BASE[st(3, p, f)]);
const F2L = ['DF', 'DR', 'DB', 'DL', 'DFR', 'DFL', 'DBR', 'DBL', 'FR', 'FL', 'BR', 'BL'];
const Y = 1, W = 0;
const topEdgesUp = (t) => ['UF', 'UR', 'UB', 'UL'].filter((p) => t[st(3, p, 'U')] === Y);
const matched = (t) => ['UF', 'UR', 'UB', 'UL'].filter((p) => t[st(3, p, p[1])] === BASE[st(3, p, p[1])]);
const inPlace = (t) => ['UFR', 'UBR', 'UBL', 'UFL'].filter((p) => sameSet(p.split('').map((f) => t[st(3, p, f)]), p.split('').map((f) => BASE[st(3, p, f)])));
const adjacent = (m) => m.length === 2 && !((m.includes('UF') && m.includes('UB')) || (m.includes('UR') && m.includes('UL')));
const checks = {
  daisy: (s, t) => ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BR', 'BL', 'DF', 'DR', 'DB', 'DL'].every((p) => {
    const cols = p.split('').map((f) => t[st(3, p, f)]);
    return !cols.includes(W) || (p[0] === 'U' && t[st(3, p, 'U')] === W);
  }),
  cross: (s, t) => solvedP(t, 'DF'),
  corners1: (s, t) => ['DFR', 'DF', 'DR', 'DB', 'DL', 'DFL', 'DBR', 'DBL'].every((p) => solvedP(t, p)),
  middle: (s, t) => F2L.every((p) => solvedP(t, p)),
  topcross: [(s, t) => adjacent(topEdgesUp(t)) && F2L.every((p) => solvedP(t, p)), (s, t) => topEdgesUp(t).join() === 'UR,UL', (s, t) => topEdgesUp(t).length === 4],
  topedges: [(s, t) => adjacent(matched(s)) && matched(t).length === 4, (s, t) => matched(s).length === 2 && !adjacent(matched(s)) && ['', 'U', 'U2', "U'"].some((u) => adjacent(matched(A(t, u)))), (s, t) => matched(t).length === 4],
  topcornerpos: [(s, t) => inPlace(s).join() === 'UFR' && inPlace(t).length === 4, (s, t) => inPlace(s).join() === 'UFR' && inPlace(t).length === 4, (s, t) => inPlace(s).length === 0 && inPlace(t).length === 1],
  topcornertwist: [(s, t) => t[st(3, 'UFR', 'U')] === Y, (s, t) => t[st(3, 'UFR', 'U')] === Y, (s, t) => C.isSolved(Uint8Array.from(t), 3) && F2L.every((p) => solvedP(s, p))],
};
let bad = 0, n = 0;
for (const L of COURSE) {
  if (L.goal) buildState(L.goal);
  (L.cases || []).forEach((c, i) => {
    const s = buildState(c);
    const t = A(s, caseMoves(c));
    const chk = Array.isArray(checks[L.id]) ? checks[L.id][i] : checks[L.id];
    n++;
    if (!chk || !chk(s, t)) { bad++; console.log('GAGAL', L.id, i, c.title); }
  });
}
console.log(`kasus kursus: ${n - bad}/${n} benar`);
process.exitCode = bad ? 1 : 0;
