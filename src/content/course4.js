// Kursus 4x4 (metode Reduksi untuk pemula):
// center putih → center kuning → 4 center samping → pasangkan edge → selesaikan seperti 3x3 → parity.
// Semua kasus dibangun dari kubus jadi + kebalikan solusinya, lalu dicek oleh tests/course4.test.mjs.
import { invertAlg, parseAlg } from '../core/cube.js';
import { PARITY } from '../core/solver/algs.js';

const FRU = "F R U R' U' F'";
const UB_PERM = "M2 U' M U2 M' U' M2";
const YELLOW = 1;

// Kasus = kubus jadi (sebagian abu-abu) → gerakan `pre` → kebalikan solusi. Jadi solusinya pasti benar.
function kasus(c) {
  const sol = c.parts.flatMap((p) => parseAlg(p.moves));
  return { N: 4, base: 'Y', ...c, setup: [c.pre || '', invertAlg(sol).join(' ')].join(' ').trim() };
}

const ONLY_WHITE_TOP = { base: 'W', ctx: ['centers:U'] };
const WHITE_YELLOW = { base: 'Y', ctx: ['centers:U', 'centers:D'] };
const ALL_CENTERS = { base: 'Y', ctx: ['centers'] };
const PAIR_UF = { base: 'Y', ctx: ['centers', 'edge:UF'], track: ['edge:UF'] };
const YELLOW_TOP_ONLY = { base: 'Y', ctx: ['centers', 'f2l', { group: 'layer:U', color: YELLOW }] };
const L_SHAPE = [...invertAlg(FRU), ...invertAlg(FRU)].join(' ');

export const COURSE4 = [
  {
    id: 'mulai',
    title: 'Kenali kubus 4x4 & mulai dari acak',
    short: 'Bedanya dengan 3x3, jenis keping, notasi lapisan dalam, dan rencana besarnya.',
    intro: true,
  },
  {
    id: 'center1',
    key: 'center1',
    title: 'Center Putih',
    short: 'Kumpulkan 4 keping center putih di atas.',
    hold: 'Di tahap ini pegang PUTIH di atas. Keping abu-abu belum penting.',
    goal: { ...ONLY_WHITE_TOP, text: 'Empat keping center putih berkumpul di sisi ATAS membentuk kotak 2x2.' },
    firstSteps: [
      'Cari keping center putih (keping 1 warna di tengah sisi). Jumlahnya 4, tersebar di mana saja.',
      'Pilih sisi yang sudah punya keping putih paling banyak, hadapkan ke atas.',
      'Buat "bar": dua keping putih berdampingan di satu sisi. Lebih mudah memindahkan 2 keping sekaligus.',
      'Naikkan bar ke atas dengan lapisan dalam (2R atau 2L). Ulangi sampai 4 keping lengkap.',
    ],
    cases: [
      kasus({ ...ONLY_WHITE_TOP, title: 'Bar putih tegak di depan, kolom di atasnya kosong', parts: [{ label: 'Naikkan', moves: '2R' }], result: 'Lapisan dalam kanan (2R) membawa bar langsung ke atas. Center putih jadi!' }),
      kasus({ ...ONLY_WHITE_TOP, title: 'Kolom kosong di atas belum sejajar dengan bar', parts: [{ label: 'Sejajarkan', moves: 'U' }, { label: 'Naikkan', moves: '2R' }], result: 'Putar sisi atas sampai kolom yang kosong tepat di atas bar, lalu 2R.' }),
      kasus({ ...ONLY_WHITE_TOP, title: 'Bar putih tidur (mendatar) di depan', parts: [{ label: 'Tegakkan', moves: 'F' }, { label: 'Naikkan', moves: '2R' }], result: 'Putar depan (F) supaya bar tegak di kolom kanan-dalam, baru dinaikkan.' }),
      kasus({ ...ONLY_WHITE_TOP, title: 'Bar putih ada di bawah', view: 'bottom', parts: [{ label: 'Naikkan 2x', moves: '2R2' }], result: 'Dari bawah langsung naik ke atas dengan 2R2 (dua kali).' }),
      kasus({ ...ONLY_WHITE_TOP, title: 'Tinggal satu keping', parts: [{ label: 'Naik', moves: '2R' }, { label: 'Geser', moves: 'U' }, { label: 'Kembali', moves: "2R'" }], result: 'Keping masuk, lalu lapisan dalam dikembalikan supaya keping putih lain tidak ikut pergi.' }),
    ],
    mistakes: [
      'Center 4x4 tidak punya posisi tetap — kamu bebas memilih sisi mana jadi atas.',
      '2R memindahkan dua keping sekaligus (satu kolom). Pastikan keping putih di atas tidak ikut terbuang.',
      'Di tahap ini lapisan dalam boleh dibiarkan berantakan; belum ada center lain yang jadi.',
    ],
    algs: [{ name: 'Naikkan kolom kanan-dalam', alg: '2R' }, { name: 'Sisipkan 1 keping', alg: "2R U 2R'" }],
  },
  {
    id: 'center2',
    key: 'center2',
    title: 'Center Kuning',
    short: 'Balik kubus, lalu bangun center kuning tanpa merusak yang putih.',
    hold: 'Balik kubus (z2): putih di BAWAH, kuning dibangun di ATAS.',
    goal: { ...WHITE_YELLOW, text: 'Center kuning di atas, center putih tetap utuh di bawah. Kuning SELALU berseberangan dengan putih.' },
    firstSteps: [
      'Balik kubus seperti memutar setir 180°: center putih sekarang di bawah.',
      'Cari keping center kuning di sisi-sisi samping.',
      'Setiap kali memakai lapisan dalam (2R), KEMBALIKAN lagi (2R\') supaya putih di bawah tidak rusak.',
      'Pola andalan: 2R U 2R\' (satu keping) dan 2R U2 2R\' (satu bar).',
    ],
    cases: [
      kasus({ ...WHITE_YELLOW, title: 'Bar kuning di depan, kolom kiri di atas masih kosong', parts: [{ label: 'Naik', moves: '2R' }, { label: 'Putar atas', moves: 'U2' }, { label: 'Kembali', moves: "2R'" }], result: 'Bar naik, atas diputar 2x supaya bar pindah ke kiri, lalu 2R\' mengembalikan putih ke bawah.' }),
      kasus({ ...WHITE_YELLOW, title: 'Satu keping kuning di depan (kolom kanan-dalam)', parts: [{ label: 'Naik', moves: '2R' }, { label: 'Geser', moves: 'U' }, { label: 'Kembali', moves: "2R'" }], result: 'Keping masuk ke slot kosong di atas, center putih tetap utuh.' }),
      kasus({ ...WHITE_YELLOW, title: 'Keping kuning di depan, tapi di kolom kiri', parts: [{ label: 'Pindah kolom', moves: "F'" }, { label: 'Naik', moves: '2R' }, { label: 'Geser', moves: 'U' }, { label: 'Kembali', moves: "2R'" }], result: 'Putar depan dulu supaya keping pindah ke kolom kanan-dalam, baru disisipkan.' }),
      kasus({ ...WHITE_YELLOW, title: 'Keping kuning ada di samping (kanan)', parts: [{ label: 'Bawa ke depan', moves: "2D'" }, { label: 'Naik', moves: '2R' }, { label: 'Geser', moves: 'U' }, { label: 'Kembali', moves: "2R'" }], result: 'Lapisan dalam bawah (2D) menggeser keping dari kanan ke depan tanpa mengganggu atas & bawah.' }),
    ],
    mistakes: [
      'Lupa mengembalikan 2R → center putih rusak. Selalu berpasangan: 2R … 2R\'.',
      'Sebelum 2R, pastikan slot kosong di atas ada di jalur yang benar (putar U dulu).',
      'Putaran sisi luar (F, R, U, …) aman untuk center atas & bawah.',
    ],
    algs: [{ name: 'Sisipkan satu keping', alg: "2R U 2R'" }, { name: 'Sisipkan bar', alg: "2R U2 2R'" }],
  },
  {
    id: 'centers4',
    key: 'centers4',
    title: '4 Center Samping',
    short: 'Lengkapi 4 center samping dengan urutan warna yang benar.',
    hold: 'Kuning di atas, putih di bawah, hijau dibangun di depan.',
    goal: { ...ALL_CENTERS, text: 'Keenam center lengkap: kuning atas, putih bawah, hijau depan, oranye kanan, biru belakang, merah kiri.' },
    firstSteps: [
      'Hafalkan urutan warna: kuning di atas & hijau di depan → ORANYE di kanan, BIRU di belakang, MERAH di kiri.',
      'Bangun center hijau di depan dulu, lalu oranye, biru, dan merah.',
      'Lapisan dalam horizontal (2U, 2D) menggeser keping antar sisi samping tanpa mengganggu kuning & putih.',
      'Dua center terakhir paling sulit: pakai pola "geser – putar – geser balik".',
    ],
    cases: [
      kasus({ ...ALL_CENTERS, track: ['centers:F'], title: 'Bar hijau ada di kanan (baris bawah)', parts: [{ label: 'Geser ke depan', moves: "2D'" }], result: '2D\' menggeser baris bawah-dalam keempat sisi sekaligus: bar hijau pindah ke depan.' }),
      kasus({ ...ALL_CENTERS, track: ['centers:F'], title: 'Bar hijau tegak di kanan', parts: [{ label: 'Tidurkan', moves: 'R' }, { label: 'Geser ke depan', moves: "2D'" }], result: 'Putar sisi kanan supaya bar mendatar di baris bawah, lalu geser ke depan.' }),
      kasus({ ...ALL_CENTERS, track: ['centers:F', 'centers:B'], title: 'Satu keping salah di kolom kanan depan', parts: [{ label: 'Tukar kolom', moves: '2R2' }, { label: 'Putar belakang', moves: 'B' }, { label: 'Tukar balik', moves: '2R2' }], result: 'Kolom depan & belakang ditukar, belakang diputar, lalu ditukar balik. Kuning & putih kembali utuh.' }),
      kasus({ ...ALL_CENTERS, track: ['centers:L', 'centers:B'], title: 'Dua center terakhir saling tertukar bar', parts: [{ label: 'Geser', moves: '2U' }, { label: 'Putar belakang', moves: 'B2' }, { label: 'Geser balik', moves: "2U'" }], result: 'Bar biru dan merah bertukar tempat; center lain kembali utuh.' }),
    ],
    mistakes: [
      'Urutan warna salah = kubus tidak akan pernah selesai. Cek: kuning atas, hijau depan → oranye kanan.',
      'Setiap 2U/2D yang menggeser center yang sudah jadi harus dikembalikan.',
      'Center kuning & putih tidak terganggu oleh 2U/2D maupun putaran sisi samping.',
    ],
    algs: [{ name: 'Geser baris', alg: "2D'" }, { name: 'Tukar kolom depan-belakang', alg: '2R2 B 2R2' }, { name: 'Dua center terakhir', alg: "2U B2 2U'" }],
  },
  {
    id: 'edges',
    key: 'edges',
    title: 'Pasangkan Edge',
    short: 'Gabungkan dua keping edge yang warnanya sama (slice – flip – slice).',
    hold: 'Kuning di atas, hijau di depan. Pasangan dibuat di lapisan tengah kanan-depan.',
    goal: { base: 'Y', ctx: ['centers', 'wings'], text: '12 edge sudah berpasangan: setiap pinggir terdiri dari 2 keping dengan warna sama.' },
    firstSteps: [
      'Edge 4x4 terdiri dari 2 keping. Cari dua keping dengan pasangan warna yang sama (misal kuning-hijau).',
      'Bawa satu keping ke kanan-depan bagian bawah, dan pasangannya ke kanan-belakang atas (atau kiri-depan atas).',
      'SATUKAN dengan lapisan dalam atas (2U atau 2U\'). Center ikut bergeser sementara — tidak apa-apa.',
      'KELUARKAN pasangan yang sudah jadi ke atas dengan R U R\', lalu KEMBALIKAN lapisan dalam (2U\' atau 2U).',
    ],
    cases: [
      kasus({ ...PAIR_UF, title: 'Siap: kanan-depan (bawah) & kanan-belakang (atas)', parts: [{ label: 'Satukan', moves: '2U' }, { label: 'Keluarkan', moves: "R U R'" }, { label: 'Kembalikan', moves: "2U'" }], result: 'Dua keping kuning-hijau jadi satu edge utuh di atas, dan center kembali rapi.' }),
      kasus({ ...PAIR_UF, title: 'Siap: kanan-depan (bawah) & kiri-depan (atas)', parts: [{ label: 'Satukan', moves: "2U'" }, { label: 'Keluarkan', moves: "R U R'" }, { label: 'Kembalikan', moves: '2U' }], result: 'Arah 2U dibalik karena pasangannya datang dari kiri.' }),
      kasus({ ...PAIR_UF, title: 'Kepingnya di kanan-atas & kanan-bawah', parts: [{ label: 'Siapkan', moves: 'R' }, { label: 'Satukan', moves: '2U' }, { label: 'Keluarkan', moves: "R U R'" }, { label: 'Kembalikan', moves: "2U'" }], result: 'Satu putaran R membawa keduanya ke lapisan tengah, lalu lanjut seperti kasus pertama.' }),
    ],
    mistakes: [
      'Sebelum "keluarkan", pastikan edge di atas yang akan masuk ke kanan-depan BELUM berpasangan (putar U kalau perlu).',
      'Lupa mengembalikan 2U → center rusak. Satukan dan kembalikan selalu berpasangan.',
      'Kerjakan 8–10 pasangan dengan cara ini. Dua edge terakhir punya trik sendiri.',
    ],
    algs: [{ name: 'Slice – flip – slice', alg: "2U R U R' 2U'" }],
  },
  {
    id: 'lastedges',
    key: 'lastedges',
    title: 'Dua Edge Terakhir',
    short: 'Trik khusus saat tinggal 2 edge yang belum berpasangan.',
    hold: 'Kuning di atas. Dua edge yang belum jadi di kanan-depan & kanan-belakang.',
    goal: { base: 'Y', ctx: ['centers', 'wings'], text: 'Semua 12 edge berpasangan dan semua center utuh. Kubus sekarang seperti 3x3 besar!' },
    firstSteps: [
      'Saat tinggal 2 edge yang belum jadi, cara biasa tidak bisa (tidak ada edge "bebas" untuk ditukar).',
      'Taruh kedua edge di lapisan tengah kanan: kanan-depan dan kanan-belakang.',
      'Satukan dengan 2U, tukar dengan rumus R F\' U R\' F, lalu kembalikan 2U\'.',
    ],
    cases: [
      kasus({ base: 'Y', ctx: ['centers', 'wings'], focusAt: ['edge:FR', 'edge:BR'], title: 'Dua edge terakhir di kanan-depan & kanan-belakang', parts: [{ label: 'Satukan', moves: '2U' }, { label: 'Tukar', moves: "R F' U R' F" }, { label: 'Kembalikan', moves: "2U'" }], result: 'Kedua edge berpasangan sekaligus. Semua edge selesai!' }),
    ],
    mistakes: [
      'Pastikan kedua edge yang belum jadi ada di kanan-depan dan kanan-belakang sebelum rumus.',
      'Kalau setelah rumus belum jadi, putar U2 atau R2 untuk mengatur ulang posisi, lalu coba lagi.',
    ],
    algs: [{ name: 'Dua edge terakhir', alg: "2U R F' U R' F 2U'" }],
  },
  {
    id: 'solve3',
    key: 'solve3',
    title: 'Selesaikan Seperti 3x3',
    short: 'Center & edge sudah jadi: sekarang 4x4 = 3x3 besar.',
    link3: true,
    hold: 'Kuning di atas, putih di bawah.',
    goal: { base: 'Y', ctx: ['all'], text: 'Kubus 4x4 selesai — dengan 8 tahap yang sama persis seperti kubus 3x3.' },
    firstSteps: [
      'Anggap setiap center 2x2 sebagai satu tengah, dan setiap pasangan edge sebagai satu edge.',
      'HANYA putar lapisan luar (R, U, F, …). Jangan putar lapisan dalam lagi, nanti center & edge rusak.',
      'Ikuti 8 tahap metode pemula 3x3: bunga, silang putih, sudut putih, lapisan tengah, silang kuning, edge kuning, posisi sudut, putar sudut.',
      'Di silang kuning dan tahap akhir mungkin muncul PARITY — kasus khusus 4x4 yang dibahas di dua pelajaran berikutnya.',
    ],
    cases: [],
    mistakes: [
      'Putaran 2x seperti F2 tetap putaran sisi luar saja (1 lapis).',
      'Kalau ada yang aneh dan tidak mungkin terjadi di 3x3, kemungkinan itu parity.',
    ],
    algs: [],
  },
  {
    id: 'ollparity',
    key: 'ollparity',
    title: 'OLL Parity',
    short: 'Silang kuning dengan 1 atau 3 edge: kasus khusus 4x4.',
    hold: 'Kuning di atas. Edge yang terbalik dipegang di depan-atas.',
    goal: { ...YELLOW_TOP_ONLY, text: 'Silang kuning yang normal: jumlah edge kuning di atas selalu genap (0, 2, atau 4).' },
    firstSteps: [
      'Di tahap Silang Kuning, hitung edge yang kuningnya menghadap atas (abaikan sudut).',
      'Kalau jumlahnya 1 atau 3 (ganjil), itu OLL parity. Di 3x3 ini mustahil.',
      'Pegang salah satu edge yang kuningnya TIDAK di atas di depan-atas, lalu lakukan rumus parity.',
      'Sekarang jumlahnya genap — lanjutkan silang kuning seperti biasa.',
    ],
    cases: [
      kasus({ ...YELLOW_TOP_ONLY, track: ['edge:UF'], title: '3 edge kuning di atas', parts: [{ label: 'OLL parity', moves: PARITY.oll4 }], result: 'Edge depan terbalik dengan sendirinya: plus kuning jadi lengkap.' }),
      kasus({ ...YELLOW_TOP_ONLY, track: ['edge:UF'], pre: `${L_SHAPE} U'`, title: 'Hanya 1 edge kuning di atas', parts: [{ label: 'OLL parity', moves: PARITY.oll4 }], result: 'Sekarang ada 2 edge kuning (huruf L). Lanjutkan dengan F R U R\' U\' F\'.' }),
    ],
    mistakes: [
      'Rumus parity panjang — pelan-pelan saja. Dua lapisan bawah tetap utuh setelahnya.',
      'Selalu pegang edge yang mau dibalik di DEPAN-ATAS.',
      'Parity bukan kesalahanmu: terjadi kira-kira separuh dari semua solve 4x4.',
    ],
    algs: [{ name: 'OLL parity', alg: PARITY.oll4 }],
  },
  {
    id: 'pllparity',
    key: 'pllparity',
    title: 'PLL Parity',
    short: 'Dua edge atas tertukar di akhir: kasus khusus 4x4.',
    hold: 'Kuning di atas. Edge yang tertukar dipegang di depan & belakang.',
    goal: { base: 'Y', ctx: ['all'], text: 'Kubus 4x4 selesai seluruhnya!' },
    firstSteps: [
      'Ciri paling jelas: semuanya beres kecuali dua edge atas yang saling tertukar.',
      'Ciri lain: di tahap Posisi Sudut, dua sudut tidak pernah bisa benar bersamaan.',
      'Kalau dua edge berseberangan tertukar: pegang di depan & belakang, lalu rumus PLL parity.',
      'Kalau tertukarnya bersebelahan: lakukan rumus parity dulu, lalu lanjutkan lapisan atas seperti biasa.',
    ],
    cases: [
      kasus({ base: 'Y', ctx: ['all'], track: ['edge:UF', 'edge:UB'], title: 'Dua edge berseberangan tertukar', parts: [{ label: 'PLL parity', moves: PARITY.pll4 }], result: 'Edge depan dan belakang bertukar. Kubus selesai!' }),
      kasus({ base: 'Y', ctx: ['all'], track: ['edge:UF', 'edge:UR'], title: 'Dua edge bersebelahan tertukar', parts: [{ label: 'PLL parity', moves: PARITY.pll4 }, { label: 'Atur', moves: 'U' }, { label: 'Putar 3 edge (Ub)', moves: UB_PERM }, { label: 'Rapikan', moves: "U'" }], result: 'Setelah parity, tinggal 3 edge yang berputar. Animasi ini memakai jalan pintas Ub-perm; cara pemula: ulangi tahap Edge Kuning lalu sudut.' }),
    ],
    mistakes: [
      'Jangan memutar seluruh kubus di tengah rumus.',
      'Lapisan dalam di rumus ini (2R2, 2U2, Uw2) — perhatikan berapa lapis yang diputar.',
      'Kemungkinan muncul PLL parity juga sekitar separuh solve. Wajar!',
    ],
    algs: [{ name: 'PLL parity', alg: PARITY.pll4 }],
  },
];

export const QUIZ_KEYS4 = ['centers4', 'edges', 'ollparity'];
