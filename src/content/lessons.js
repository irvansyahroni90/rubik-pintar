// Materi belajar per ukuran & metode. Setiap rumus bisa dianimasikan di aplikasi.
import { OLL, PLL, OLL2_EDGES, OLL2_CORNERS, PLL2_CORNERS, PLL2_EDGES, ORTEGA_OLL, ORTEGA_PBL, PARITY } from '../core/solver/algs.js';

const LBL3_STAGES = [
  {
    title: 'Bunga (Daisy)',
    text: 'Pegang kubus dengan tengah kuning di atas. Bawa 4 edge putih ke atas sehingga mengelilingi tengah kuning, dengan warna putih menghadap atas. Tidak perlu rumus — cukup coba-coba dengan tenang.',
    tips: ['Kalau tempat tujuan di atas sudah terisi, putar U dulu supaya kosong.', 'Edge di lapisan tengah: cukup satu putaran sisi untuk menaikkannya.'],
    algs: [],
  },
  {
    title: 'Silang Putih',
    text: 'Putar U sampai warna samping sebuah kelopak cocok dengan tengah di bawahnya, lalu putar sisi itu 2x. Ulangi untuk keempat kelopak.',
    tips: ['Sekarang putih ada di bawah, kuning di atas — biarkan begini sampai selesai.'],
    algs: [{ name: 'Turunkan kelopak', alg: 'F2', note: 'Sisi mana pun yang sejajar (F2, R2, B2, L2).' }],
  },
  {
    title: 'Sudut Lapisan Pertama',
    text: 'Cari sudut yang punya warna putih di atas. Putar U sampai sudut itu tepat di atas slot tujuannya (kanan-depan bawah), lalu ulangi rumus "sexy move" sampai sudut masuk dengan benar.',
    tips: ['Maksimal 5x pengulangan.', 'Sudut salah tempat di bawah? Lakukan rumusnya sekali untuk mengeluarkannya.'],
    algs: [{ name: 'Sexy move', alg: "R U R' U'", note: 'Ulangi 1, 3, atau 5 kali.' }],
  },
  {
    title: 'Lapisan Tengah',
    text: 'Cari edge di atas tanpa warna kuning. Samakan warna depannya dengan tengah depan (bentuk T terbalik), lihat warna atasnya: cocok dengan kanan atau kiri? Pakai rumus yang sesuai.',
    tips: ['Edge di lapisan tengah tapi terbalik: masukkan edge lain ke slot itu untuk mengeluarkannya.'],
    algs: [
      { name: 'Masukkan ke kanan', alg: "U R U' R' U' F' U F" },
      { name: 'Masukkan ke kiri', alg: "U' L' U L U F U' F'" },
    ],
  },
  {
    title: 'Silang Kuning',
    text: 'Lihat sisi atas: titik, huruf L, garis, atau sudah plus? Pakai satu rumus ini berulang sambil memegang polanya dengan benar.',
    tips: ['Huruf L: pegang di kiri & belakang.', 'Garis: pegang mendatar.'],
    algs: [{ name: 'Silang kuning', alg: "F R U R' U' F'" }],
  },
  {
    title: 'Edge Kuning',
    text: 'Putar U sampai 2 edge cocok dengan tengahnya. Kalau bersebelahan, pegang di belakang & kanan lalu lakukan rumus. Kalau berseberangan, lakukan rumus sekali dulu.',
    tips: ['Rumus ini disebut "Sune" + U.'],
    algs: [{ name: 'Tukar edge (Sune)', alg: "R U R' U R U2 R' U" }],
  },
  {
    title: 'Posisi Sudut Kuning',
    text: 'Cari sudut yang sudah di tempat yang benar (warnanya cocok dengan 3 sisi di sekitarnya, walau terpelintir). Pegang di kanan-depan-atas, lalu lakukan rumus 1–2 kali.',
    tips: ['Belum ada yang benar? Lakukan rumusnya sekali dari posisi mana saja.'],
    algs: [{ name: 'Putar 3 sudut', alg: "U R U' L' U R' U' L" }],
  },
  {
    title: 'Putar Sudut Kuning',
    text: 'Pegang kuning di atas. Sudut yang belum beres di kanan-depan-atas: ulangi R\' D\' R D sampai kuningnya menghadap atas. Lalu putar HANYA sisi atas (U) untuk membawa sudut berikutnya. Jangan putar seluruh kubus!',
    tips: ['Bagian bawah terlihat berantakan di tengah proses — itu normal.', 'Akhiri dengan putaran U untuk merapikan.'],
    algs: [{ name: 'Putar sudut', alg: "R' D' R D", note: 'Ulangi 2 atau 4 kali per sudut.' }],
  },
];

const CFOP_INTRO_STAGES = (full) => [
  {
    title: 'Cross',
    text: 'Buat silang putih langsung di bawah (tanpa bunga). Rencanakan saat inspeksi: target ≤ 8 gerakan.',
    tips: ['Latih cross dengan mata tertutup setelah merencanakannya.', 'Edge yang berseberangan lebih mudah dipasang bersamaan.'],
    algs: [],
  },
  {
    title: 'F2L (First Two Layers)',
    text: 'Gabungkan sudut putih dengan edge pasangannya di lapisan atas, lalu masukkan bersama ke slot. Pahami 3 pola dasar, sisanya turunan.',
    tips: ['Pisahkan pasangan yang "salah sambung" dulu.', 'Gunakan slot kosong untuk menyimpan pasangan sementara.', 'Look-ahead: sambil memasukkan satu pasangan, cari pasangan berikutnya.'],
    algs: [
      { name: 'Pasangan sudah jadi (kanan)', alg: "U R U' R'" },
      { name: 'Pasangan sudah jadi (depan)', alg: "U' F' U F" },
      { name: 'Sisip dasar', alg: "R U R'" },
      { name: 'Pisah lalu sambung', alg: "R U2 R' U' R U R'" },
      { name: 'Sudut di slot, edge di atas', alg: "U R U' R' U' F' U F" },
    ],
  },
  full ? {
    title: 'OLL — 57 kasus',
    text: 'Satu rumus untuk membuat seluruh sisi atas kuning. Pelajari bertahap: mulai dari kasus "silang sudah jadi" (OLL 21–27).',
    tips: ['Kelompokkan berdasarkan bentuk: titik, garis, huruf L, persegi, kilat, ikan…'],
    algs: OLL.map((o) => ({ name: o.name, alg: o.alg })),
  } : {
    title: 'OLL 2-Look',
    text: 'Langkah 1: silang kuning (3 kasus). Langkah 2: sudut kuning (7 kasus).',
    tips: ['Rumus garis & L adalah rumus silang kuning metode pemula — kamu sudah tahu satu!'],
    algs: [...OLL2_EDGES, ...OLL2_CORNERS].map((o) => ({ name: o.name, alg: o.alg })),
  },
  full ? {
    title: 'PLL — 21 kasus',
    text: 'Satu rumus untuk menukar posisi keping lapisan atas. Kenali dari "lampu depan" (dua stiker sama warna di satu sisi) dan "bar" (tiga stiker sama).',
    tips: ['Mulai dari T, Ua, Ub, H, Z, Aa, Ab — paling sering keluar.'],
    algs: PLL.map((o) => ({ name: o.name, alg: o.alg })),
  } : {
    title: 'PLL 2-Look',
    text: 'Langkah 1: susun sudut (T-perm atau Y-perm). Langkah 2: susun edge (Ua, Ub, H, Z).',
    tips: ['Lampu depan di satu sisi → T-perm dari sisi itu di kiri.', 'Tidak ada lampu → Y-perm.'],
    algs: [...PLL2_CORNERS, ...PLL2_EDGES].map((o) => ({ name: o.name, alg: o.alg })),
  },
];

const REDUCTION_STAGES = (N) => [
  {
    title: 'Center',
    text: N === 4
      ? 'Kumpulkan 4 keping tengah tiap sisi. Kerjakan 2 center berseberangan dulu (putih & kuning), lalu 4 sisanya. Ingat: 4x4 tidak punya center tetap, jadi perhatikan urutan warna (putih-kuning, merah-oranye, hijau-biru berseberangan).'
      : 'Lengkapi 8 keping di sekitar center tetap tiap sisi. Buat bentuk "bar" 3 keping dulu, lalu gabungkan.',
    tips: ['Sisipkan keping dengan gerakan lapisan dalam, putar sisi, lalu kembalikan lapisan dalam.', 'Hijau di kiri kuning? Cek skema warna: putih-atas, hijau-depan → merah di kanan.'],
    algs: [
      { name: 'Sisip keping (dasar)', alg: "2R U 2R'", note: 'Bawa keping ke posisi atas lalu naikkan ke sisi depan.' },
      { name: 'Sisip bar', alg: "Rw U Rw'", note: 'Memindahkan 2 keping sekaligus.' },
    ],
  },
  {
    title: N === 4 ? 'Pasangkan Edge' : 'Pasangkan Edge (Tredge)',
    text: 'Teknik slice–flip–slice: satukan dua keping edge dengan putaran lapisan dalam, keluarkan edge jadi dengan rumus flip, lalu kembalikan lapisan dalam.',
    tips: ['Edge yang belum jadi harus ada di atas saat flip, supaya yang jadi tidak rusak.', 'Dua edge terakhir punya trik khusus.'],
    algs: [
      { name: 'Flip edge', alg: "R U R' F R' F' R" },
      { name: 'Slice–flip–slice', alg: "Dw R U R' F R' F' R Dw'" },
      { name: '2 edge terakhir', alg: "Dw R F' U R' F Dw'" },
      ...(N === 5 ? [{ name: 'Parity edge 5x5', alg: PARITY.edge5, n: 5 }] : []),
    ],
  },
  {
    title: 'Selesaikan seperti 3x3',
    text: 'Sekarang kubus berperilaku seperti 3x3 raksasa. Pakai metode pemula atau CFOP — hanya putar lapisan luar.',
    tips: N === 4 ? ['Silang kuning tidak bisa jadi (1 atau 3 edge)? Itu OLL parity.', 'Dua edge/sudut harus tukar langsung di akhir? Itu PLL parity.'] : ['Di 5x5 tidak ada OLL/PLL parity, karena ada center & edge tetap.'],
    algs: N === 4 ? [
      { name: 'OLL parity', alg: PARITY.oll4, n: 4 },
      { name: 'PLL parity', alg: PARITY.pll4, n: 4 },
    ] : [],
  },
];

export const LESSONS = {
  2: {
    lbl: {
      title: 'Pemula 2x2',
      intro: '2x2 = hanya sudut-sudut dari 3x3. Kalau bisa 3x3 metode pemula, kamu sudah bisa 2x2!',
      stages: [
        { title: 'Lapisan Pertama', text: 'Bangun 4 sudut putih di bawah dengan warna samping yang serasi. Pakai sexy move seperti di 3x3.', tips: ['Karena tidak ada center, pilih satu sudut putih sebagai patokan.'], algs: [{ name: 'Sexy move', alg: "R U R' U'" }] },
        { title: 'Posisi Sudut Atas', text: 'Putar U sampai minimal satu sudut di posisinya, pegang di kanan-depan-atas, lalu rumus tukar 3 sudut.', tips: [], algs: [{ name: 'Putar 3 sudut', alg: "U R U' L' U R' U' L" }] },
        { title: 'Putar Sudut Atas', text: 'Sama seperti 3x3: R\' D\' R D berulang untuk tiap sudut di kanan-depan-atas.', tips: ['Jangan putar seluruh kubus.'], algs: [{ name: 'Putar sudut', alg: "R' D' R D" }] },
      ],
    },
    ortega: {
      title: 'Ortega 2x2',
      intro: 'Metode menengah: buat satu sisi, orientasikan atas (OLL), lalu tukar dua lapisan sekaligus (PBL). Rata-rata ±20 gerakan.',
      stages: [
        { title: 'Satu Sisi', text: 'Buat satu sisi putih di bawah — sampingnya belum perlu cocok.', tips: ['Latih intuitif; biasanya ≤ 6 gerakan.'], algs: [] },
        { title: 'OLL (7 kasus)', text: 'Buat sisi atas satu warna.', tips: ['Sama dengan OLL sudut CFOP.'], algs: ORTEGA_OLL.map((o) => ({ name: o.name, alg: o.alg, n: 2 })) },
        { title: 'PBL', text: 'Tukar sudut di atas & bawah agar lengkap.', tips: ['Cek lampu depan di atas dan bawah.'], algs: ORTEGA_PBL.map((o) => ({ name: o.name, alg: o.alg, n: 2 })) },
      ],
    },
  },
  3: {
    lbl: { title: 'Pemula 3x3', intro: '8 tahap, 7 rumus pendek. Rata-rata 2–3 menit di awal, bisa di bawah 1 menit setelah lancar.', stages: LBL3_STAGES },
    cfop2: { title: 'CFOP 4-Look', intro: 'Jembatan dari pemula ke speedcubing: F2L intuitif + 16 rumus. Target: di bawah 30 detik.', stages: CFOP_INTRO_STAGES(false) },
    cfop: { title: 'CFOP Penuh', intro: 'Metode juara dunia: Cross, F2L, OLL 57, PLL 21. Rata-rata ±55 gerakan.', stages: CFOP_INTRO_STAGES(true) },
  },
  4: {
    lbl: { title: 'Reduksi 4x4', intro: 'Ubah 4x4 menjadi "3x3 besar": center → pasangkan edge → selesaikan seperti 3x3 (+ parity).', stages: REDUCTION_STAGES(4) },
  },
  5: {
    lbl: { title: 'Reduksi 5x5', intro: 'Sama seperti 4x4, tapi 5x5 punya center & edge tengah tetap — jadi lebih mirip 3x3.', stages: REDUCTION_STAGES(5) },
  },
};

export function lessonFor(N, method) {
  const set = LESSONS[N];
  if (set[method]) return set[method];
  if (N >= 4) {
    const base = set.lbl;
    const three = LESSONS[3][method] || LESSONS[3].lbl;
    return { ...base, title: base.title + ' + ' + three.title.replace(' 3x3', ''), stages: [...base.stages.slice(0, 2), ...three.stages, ...(N === 4 ? [base.stages[2]] : [])] };
  }
  return set.lbl;
}
