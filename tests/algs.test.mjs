import * as C from '../src/core/cube.js';
import { OLL, PLL, OLL2_EDGES, OLL2_CORNERS, PLL2_CORNERS, PLL2_EDGES, ORTEGA_OLL, ORTEGA_PBL } from '../src/core/solver/algs.js';
const N = 3;
const solved = C.solvedState(3);
const f2lIntact = (s) => { // D face, and rows 1-2 of side faces
  for (let i = 27; i < 36; i++) if (s[i] !== solved[i]) return false;
  for (const f of [1, 2, 4, 5]) for (let i = 3; i < 9; i++) if (s[f * 9 + i] !== solved[f * 9 + i]) return false;
  return true;
};
const uOriented = (s) => { for (let i = 0; i < 9; i++) if (s[i] !== s[4]) return false; return true; };
let bad = 0;
const check = (set, kind) => {
  for (const a of set) {
    const s = C.applyMoves(solved, 3, C.invertAlg(a.alg));
    const ok = f2lIntact(s) && (kind === 'oll' ? !uOriented(s) : uOriented(s)) && !C.isSolved(s, 3);
    if (!ok) { bad++; console.log('BAD', kind, a.id, a.alg, 'f2l', f2lIntact(s), 'uOri', uOriented(s)); }
  }
};
check(OLL, 'oll'); check(OLL2_EDGES, 'oll'); check(OLL2_CORNERS, 'oll');
check(PLL, 'pll'); check(PLL2_CORNERS, 'pll'); check(PLL2_EDGES, 'pll');
// coverage of distinct OLL cases: canonical U-face orientation pattern up to AUF
const ollKey = (s) => { // pattern of top color on U face + side top-row stickers, minimal over 4 rotations
  const keys = [];
  for (let k = 0; k < 4; k++) {
    const t = C.applyMoves(s, 3, Array(k).fill('U'));
    const top = t[4];
    const pat = [];
    for (let i = 0; i < 9; i++) pat.push(t[i] === top ? 1 : 0);
    for (const f of [1, 2, 4, 5]) for (let i = 0; i < 3; i++) pat.push(t[f * 9 + i] === top ? 1 : 0);
    keys.push(pat.join(''));
  }
  return keys.sort()[0];
};
const ollKeys = new Map();
for (const a of OLL) { const k = ollKey(C.applyMoves(solved, 3, C.invertAlg(a.alg))); if (ollKeys.has(k)) console.log('DUP OLL', a.id, 'same as', ollKeys.get(k)); ollKeys.set(k, a.id); }
console.log('distinct OLL cases', ollKeys.size);
const pllKey = (s) => { const keys = []; for (let k = 0; k < 4; k++) { const t = C.applyMoves(s, 3, Array(k).fill('U')); for (let j=0;j<4;j++){ const t2 = C.applyMoves(t,3,Array(j).fill('y')); keys.push([...[1,2,4,5].flatMap(f=>[0,1,2].map(i=>t2[f*9+i]))].join(','));} } return keys.sort()[0]; };
// PLL key must be color-relative: use relation pattern instead
const pllRel = (s) => { const keys=[]; for (let k=0;k<4;k++){ const t=C.applyMoves(s,3,Array(k).fill('U')); for (let j=0;j<4;j++){ const t2=C.applyMoves(t,3,Array(j).fill('y')); const row=[2,1,5,4].flatMap(f=>[0,1,2].map(i=>t2[f*9+i])); const map=new Map(); const rel=row.map(c=>{ if(!map.has(c)) map.set(c,map.size); return map.get(c);}); keys.push(rel.join(''));}} return keys.sort()[0]; };
const pllKeys = new Map();
for (const a of PLL) { const k = pllRel(C.applyMoves(solved, 3, C.invertAlg(a.alg))); if (pllKeys.has(k)) console.log('DUP PLL', a.id, 'same as', pllKeys.get(k)); pllKeys.set(k, a.id); }
console.log('distinct PLL cases', pllKeys.size);
// 2x2
const s2 = C.solvedState(2);
const dIntact2 = (s) => { for (let i = 12; i < 16; i++) if (s[i] !== s2[i]) return false; for (const f of [1,2,4,5]) for (const i of [2,3]) if (s[f*4+i]!==s2[f*4+i]) return false; return true; };
const ori2 = (s) => [0,1,2,3].every(i=>s[i]===s[0]) && [12,13,14,15].every(i=>s[i]===s[12]);
for (const a of ORTEGA_OLL) { const s = C.applyMoves(s2, 2, C.invertAlg(a.alg)); if (!dIntact2(s) || ori2(s)) { bad++; console.log('BAD ortega oll', a.id); } }
for (const a of ORTEGA_PBL) { const s = C.applyMoves(s2, 2, C.invertAlg(a.alg)); if (!ori2(s) || C.isSolved(s,2)) { bad++; console.log('BAD ortega pbl', a.id, ori2(s)); } }
console.log('bad algs:', bad);
