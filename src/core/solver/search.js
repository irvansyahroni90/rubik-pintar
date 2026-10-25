// Pencarian IDDFS umum di atas permutasi facelet
import { movePerm, parseToken } from '../cube.js';

export const OUTER_MOVES = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];

function famInfo(N, toks) {
  return toks.map((t) => {
    const p = parseToken(t, N);
    return { axis: p.axis, fam: p.axis + ':' + p.layers.join(','), minLayer: Math.min(...p.layers) };
  });
}

// goal(state) -> bool ; h(state) -> batas bawah (opsional)
export function iddfs(start, N, toks, maxDepth, goal, h = null, nodeLimit = 4e6) {
  if (goal(start)) return [];
  const perms = toks.map((t) => movePerm(N, t));
  const info = famInfo(N, toks);
  const len = start.length;
  const bufs = Array.from({ length: maxDepth + 1 }, () => new Uint8Array(len));
  bufs[0].set(start);
  const path = new Int32Array(maxDepth + 1);
  let nodes = 0;
  let found = -1;

  function allowed(last, i) {
    if (last < 0) return true;
    const a = info[last];
    const b = info[i];
    if (a.fam === b.fam) return false;
    if (a.axis === b.axis && b.minLayer < a.minLayer) return false; // urutan kanonik sumbu sama
    return true;
  }

  function dfs(depth, limit, last) {
    const cur = bufs[depth];
    const nxt = bufs[depth + 1];
    for (let i = 0; i < perms.length; i++) {
      if (!allowed(last, i)) continue;
      const p = perms[i];
      for (let j = 0; j < len; j++) nxt[j] = cur[p[j]];
      nodes++;
      path[depth] = i;
      if (depth + 1 === limit) {
        if (goal(nxt)) { found = limit; return true; }
      } else {
        if (h && depth + 1 + h(nxt) > limit) continue;
        if (nodes > nodeLimit) return false;
        if (dfs(depth + 1, limit, i)) return true;
      }
    }
    return false;
  }

  for (let d = 1; d <= maxDepth; d++) {
    if (h && h(start) > d) continue;
    if (dfs(0, d, -1)) return Array.from(path.slice(0, found)).map((i) => toks[i]);
    if (nodes > nodeLimit) break;
  }
  return null;
}
