// Konteks penyelesaian: menyimpan state kubus, mencatat tahap & langkah beserta penjelasannya
import { applyMove, parseAlg, parseToken, FI, NORMALS, rotQ } from '../cube.js';
import { st, colorsAt, blockStickers } from '../pieces.js';

export const COLOR_NAME = ['putih', 'kuning', 'merah', 'oranye', 'hijau', 'biru'];
export const COLOR_EMOJI = ['⬜', '🟨', '🟥', '🟧', '🟩', '🟦'];
export const cn = (id) => COLOR_NAME[id];
export const ce = (id) => COLOR_EMOJI[id];
export const piece = (cols) => cols.map(ce).join('') + ' (' + cols.map(cn).join('-') + ')';

const FACE_ID_BY_NORMAL = (n) => NORMALS.findIndex((m) => m[0] === n[0] && m[1] === n[1] && m[2] === n[2]);

export class Ctx {
  constructor(N, state, opts = {}) {
    this.N = N;
    this.state = Uint8Array.from(state);
    this.vc = opts.virtualCenters ? opts.virtualCenters.slice() : null;
    this.stages = [];
    this.cur = null;
    this.flags = {};
  }

  center(face) {
    if (this.vc) return this.vc[FI[face]];
    return this.state[st(this.N, face, face)];
  }

  c(name, face) { return this.state[st(this.N, name, face)]; }
  colors(name) { return colorsAt(this.state, this.N, name); }
  stickers(name) { return blockStickers(this.N, name); }

  applyRaw(moves) {
    for (const tok of parseAlg(moves)) {
      this.state = applyMove(this.state, this.N, tok);
      if (this.vc && /^[xyz]/.test(tok)) {
        const p = parseToken(tok, this.N);
        const nv = this.vc.slice();
        for (let f = 0; f < 6; f++) {
          const nn = rotQ(NORMALS[f], p.axis, p.q);
          nv[FACE_ID_BY_NORMAL(nn)] = this.vc[f];
        }
        this.vc = nv;
      }
    }
  }

  stage(key, title, intro, tips = []) {
    this.cur = { key, title, intro, tips, steps: [] };
    this.stages.push(this.cur);
    return this.cur;
  }

  // Catat langkah dan terapkan gerakannya
  step(title, text, moves, extra = {}) {
    const toks = parseAlg(moves);
    if (!toks.length && !extra.keepEmpty) return null;
    if (!this.cur) this.stage('misc', 'Langkah', '');
    const s = { title, text, moves: toks, focus: extra.focus || [], alg: extra.alg || null, kind: extra.kind || 'move' };
    this.cur.steps.push(s);
    this.applyRaw(toks);
    return s;
  }

  note(title, text, extra = {}) {
    if (!this.cur) this.stage('misc', 'Langkah', '');
    const s = { title, text, moves: [], focus: extra.focus || [], kind: 'note' };
    this.cur.steps.push(s);
    return s;
  }

  // Sampel 3x3 dari kubus NxN (untuk pencarian cepat)
  view3() {
    const N = this.N;
    if (N === 3) return Uint8Array.from(this.state);
    const out = new Uint8Array(54);
    const mid = Math.floor((N - 1) / 2);
    const m = [0, mid, N - 1];
    for (let f = 0; f < 6; f++) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) out[f * 9 + r * 3 + c] = this.state[f * N * N + m[r] * N + m[c]];
      }
    }
    return out;
  }
}

// Utilitas: ulang token n kali
export function repeat(alg, n) {
  const t = parseAlg(alg);
  const out = [];
  for (let i = 0; i < n; i++) out.push(...t);
  return out;
}

export { st };
