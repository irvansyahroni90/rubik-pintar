// Penjelasan gerakan dalam bahasa Indonesia
import { parseToken } from './cube.js';

const FACE_ID = { R: 'kanan', L: 'kiri', U: 'atas', D: 'bawah', F: 'depan', B: 'belakang' };
// arah putaran searah jarum jam bila dilihat dari depan sisi itu, dijelaskan dari sudut pandang pemain
const CW_DESC = {
  R: ['ke atas', 'ke bawah'],
  L: ['ke bawah', 'ke atas'],
  U: ['ke kiri', 'ke kanan'],
  D: ['ke kanan', 'ke kiri'],
  F: ['searah jarum jam', 'berlawanan jarum jam'],
  B: ['berlawanan jarum jam (dilihat dari depan)', 'searah jarum jam (dilihat dari depan)'],
};
const ROT_DESC = {
  x: ['Seluruh kubus diguling ke atas (seperti R)', 'Seluruh kubus diguling ke bawah (seperti R\')'],
  y: ['Seluruh kubus diputar ke kiri (seperti U)', 'Seluruh kubus diputar ke kanan (seperti U\')'],
  z: ['Seluruh kubus dimiringkan searah jarum jam (seperti F)', 'Seluruh kubus dimiringkan berlawanan jarum jam (seperti F\')'],
};

export function describeMove(tok, N = 3) {
  let p;
  try { p = parseToken(tok, N); } catch (e) { return { title: tok, text: 'Gerakan tidak dikenal' }; }
  const prime = tok.endsWith("'") && !tok.endsWith("2'");
  const dbl = p.times === 2;
  const letter = tok.replace(/^\d+/, '')[0];
  if (/[xyz]/.test(letter)) {
    const d = ROT_DESC[letter][prime ? 1 : 0];
    return { title: tok, text: dbl ? d.replace(/\(seperti .*\)/, '').trim() + ' 2x (180°)' : d, kind: 'rotation' };
  }
  const face = p.face;
  const dir = CW_DESC[face][prime ? 1 : 0];
  let what;
  if (p.kind === 'slice') what = 'Semua lapisan tengah (antara ' + ({ L: 'kiri & kanan', D: 'atas & bawah', F: 'depan & belakang' })[face] + ')';
  else if (p.kind === 'inner') what = `Lapisan ke-${p.layers.length ? (/^(\d+)/.exec(tok) || [0, 2])[1] : 2} dari ${FACE_ID[face]}`;
  else if (p.kind === 'wide') what = `${p.layers.length} lapisan ${FACE_ID[face]}`;
  else what = `Sisi ${FACE_ID[face]}`;
  return {
    title: tok,
    text: dbl ? `${what} diputar 2x (180°)` : `${what} diputar ${dir}`,
    kind: p.kind,
  };
}

export const NOTATION_GROUPS = (N) => {
  const base = ['R', 'L', 'U', 'D', 'F', 'B'];
  const groups = [{ title: 'Sisi luar', moves: base.flatMap((f) => [f, f + "'", f + '2']) }];
  if (N >= 3) groups.push({ title: 'Lapisan tengah', moves: ['M', "M'", 'E', "E'", 'S', "S'"] });
  if (N >= 4) groups.push({ title: 'Lapisan dalam & lebar', moves: ['2R', "2R'", '2U', "2U'", 'Rw', "Rw'", 'Uw', "Uw'", ...(N === 5 ? ['3R', "3R'"] : [])] });
  if (N === 3) groups.push({ title: 'Lebar (huruf kecil)', moves: ['r', "r'", 'u', "u'", 'f', "f'"] });
  groups.push({ title: 'Putar seluruh kubus', moves: ['x', "x'", 'y', "y'", 'z', "z'"] });
  return groups;
};
