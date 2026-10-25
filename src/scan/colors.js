// Deteksi warna stiker dari foto
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 1e-6) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

export function rgbToLab(r, g, b) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const R = lin(r); const G = lin(g); const B = lin(b);
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// Klasifikasi cepat satu sampel (dipakai untuk pratinjau langsung)
export function quickClassify([r, g, b]) {
  const [h, s, v] = rgbToHsv(r, g, b);
  if (s < 0.24 && v > 0.42) return 0; // putih
  if (h < 12 || h >= 330) return 2; // merah
  if (h < 40) return (s < 0.35 && v > 0.7) ? 0 : 3; // oranye
  if (h < 75) return (s < 0.33) ? 0 : 1; // kuning
  if (h < 170) return 4; // hijau
  if (h < 265) return 5; // biru
  return 2;
}

const dist = (a, b) => Math.sqrt(0.45 * (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

const PALETTE = [[235, 238, 240], [245, 210, 40], [200, 35, 45], [245, 115, 30], [30, 170, 85], [30, 90, 210]].map((c) => rgbToLab(...c));

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => { for (const p of permutations([...arr.slice(0, i), ...arr.slice(i + 1)])) out.push([x, ...p]); });
  return out;
}
const PERMS6 = permutations([0, 1, 2, 3, 4, 5]);

// Beri nama warna pada 6 centroid (Lab) dengan pencocokan terbaik ke palet
function nameClusters(centroids) {
  let best = null;
  for (const p of PERMS6) {
    let c = 0;
    for (let k = 0; k < 6; k++) c += dist(centroids[k], PALETTE[p[k]]);
    if (!best || c < best.c) best = { c, p };
  }
  return best.p;
}

/**
 * Klasifikasi semua stiker sekaligus dengan batas kapasitas (tiap warna tepat N*N).
 * @param {number[][]} samples array 6*N*N berisi [r,g,b] (atau null jika kosong)
 */
export function classifyAll(samples, N) {
  const n2 = N * N;
  const labs = samples.map((s) => (s ? rgbToLab(...s) : null));
  const quick = samples.map((s) => (s ? quickClassify(s) : 6));
  const centerIdx = N % 2 === 1 ? [0, 1, 2, 3, 4, 5].map((f) => f * n2 + ((N - 1) / 2) * N + (N - 1) / 2) : null;
  // centroid awal
  let centroids;
  if (centerIdx) {
    centroids = centerIdx.map((i) => labs[i] || PALETTE[0]);
  } else {
    centroids = [0, 1, 2, 3, 4, 5].map((c) => {
      const mem = labs.filter((l, i) => l && quick[i] === c);
      if (!mem.length) return PALETTE[c];
      return [0, 1, 2].map((k) => mem.reduce((a, m) => a + m[k], 0) / mem.length);
    });
  }
  let assign = new Array(samples.length).fill(-1);
  for (let iter = 0; iter < 6; iter++) {
    const pairs = [];
    labs.forEach((l, i) => { if (!l) return; for (let k = 0; k < 6; k++) pairs.push([dist(l, centroids[k]), i, k]); });
    pairs.sort((a, b) => a[0] - b[0]);
    const cap = new Array(6).fill(n2);
    assign = new Array(samples.length).fill(-1);
    if (centerIdx) centerIdx.forEach((i, k) => { if (labs[i]) { assign[i] = k; cap[k]--; } });
    for (const [, i, k] of pairs) { if (assign[i] >= 0 || cap[k] <= 0) continue; assign[i] = k; cap[k]--; }
    const nc = [0, 1, 2, 3, 4, 5].map((k) => {
      const mem = labs.filter((l, i) => l && assign[i] === k);
      if (!mem.length) return centroids[k];
      return [0, 1, 2].map((d) => mem.reduce((a, m) => a + m[d], 0) / mem.length);
    });
    centroids = nc;
  }
  const names = nameClusters(centroids);
  return assign.map((k, i) => (k < 0 ? quick[i] : names[k]));
}

// Ambil sampel warna rata-rata (median) dari grid N x N pada canvas
export function sampleGrid(ctx2d, x0, y0, size, N) {
  const out = [];
  const cell = size / N;
  const inner = cell * 0.46;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cx = x0 + (c + 0.5) * cell; const cy = y0 + (r + 0.5) * cell;
      const x = Math.max(0, Math.round(cx - inner / 2)); const y = Math.max(0, Math.round(cy - inner / 2));
      const w = Math.max(2, Math.round(inner));
      const d = ctx2d.getImageData(x, y, w, w).data;
      const R = []; const G = []; const B = [];
      for (let i = 0; i < d.length; i += 8) { R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]); }
      const med = (a) => { a.sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
      out.push([med(R), med(G), med(B)]);
    }
  }
  return out;
}
