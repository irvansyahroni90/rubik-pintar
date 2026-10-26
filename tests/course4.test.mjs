// Semua kasus Kursus 4x4 harus benar-benar menghasilkan yang dijelaskan
import * as C from '../src/core/cube.js';
import { buildState, caseMoves, groupN, baseN, caseFocus } from '../src/learn/build.js';
import { COURSE4 } from '../src/content/course4.js';
const N = 4;
const A = (s, m) => Array.from(C.applyMoves(s, N, m));
const W = 0, Y = 1;
const B = baseN(4, 'Y');
const centersOf = (s, f) => groupN(4, `centers:${f}`).map((i) => s[i]);
const allCentersOk = (s) => groupN(4, 'centers').every((i) => s[i] === B[i]);
const EDGES = ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BR', 'BL', 'DF', 'DR', 'DB', 'DL'];
const paired = (s) => EDGES.filter((e) => { const a = groupN(4, `wing:${e}:+`), b = groupN(4, `wing:${e}:-`); return a.every((i, k) => s[i] === s[b[k]] && s[i] !== 6); });
const topUp = (s) => ['UF', 'UR', 'UB', 'UL'].filter((e) => groupN(4, `edge:${e}`).filter((i) => Math.floor(i / 16) === 0).every((i) => s[i] === Y));
const adjacent = (m) => m.length === 2 && !((m.includes('UF') && m.includes('UB')) || (m.includes('UR') && m.includes('UL')));
const checks = {
  center1: (s, t) => centersOf(t, 'U').every((c) => c === W) && !centersOf(s, 'U').every((c) => c === W),
  center2: (s, t) => centersOf(t, 'U').every((c) => c === Y) && centersOf(t, 'D').every((c) => c === W) && centersOf(s, 'D').every((c) => c === W) && !centersOf(s, 'U').every((c) => c === Y),
  centers4: (s, t) => allCentersOk(t) && !allCentersOk(s) && centersOf(s, 'U').every((c) => c === Y) && centersOf(s, 'D').every((c) => c === W),
  edges: (s, t) => allCentersOk(s) && allCentersOk(t) && paired(t).includes('UF') && groupN(4, 'edge:UF').every((i) => t[i] === B[i]) && !paired(s).length,
  lastedges: (s, t) => allCentersOk(s) && allCentersOk(t) && paired(s).length === 10 && paired(t).length === 12,
  ollparity: [(s, t) => topUp(s).length === 3 && topUp(t).length === 4, (s, t) => topUp(s).length === 1 && adjacent(topUp(t))],
  pllparity: [(s, t) => C.isSolved(Uint8Array.from(t), 4), (s, t) => C.isSolved(Uint8Array.from(t), 4)],
};
let bad = 0, n = 0;
for (const L of COURSE4) {
  if (L.goal) buildState({ N: 4, ...L.goal });
  (L.cases || []).forEach((c, i) => {
    const s = buildState(c);
    const t = A(s, caseMoves(c));
    const chk = Array.isArray(checks[L.id]) ? checks[L.id][i] : checks[L.id];
    const f = caseFocus(c);
    n++;
    if (!chk || !chk(s, t)) { bad++; console.log('GAGAL', L.id, i, c.title); }
    else if ((c.track || c.focusAt) && !f.length) { bad++; console.log('fokus kosong', L.id, i); }
  });
}
console.log(`kasus kursus 4x4: ${n - bad}/${n} benar`);
process.exitCode = bad ? 1 : 0;
