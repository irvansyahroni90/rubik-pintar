// Kursus Pemula 3x3: pelajaran bertahap, tiap tahap berisi tujuan, langkah awal dari kubus acak,
// kasus "kalau kamu lihat ini → lakukan ini" (dengan animasi), kesalahan umum, dan latihan.
// Posisi pegang selama kursus: KUNING di atas, PUTIH di bawah, HIJAU menghadapmu.
// Keadaan kasus dibangun oleh src/learn/build.js dan diverifikasi oleh tests/course.test.mjs.

const SEXY = "R U R' U'";
const RIGHT = "U R U' R' U' F' U F";
const LEFT = "U' L' U L U F U' F'";
const FRU = "F R U R' U' F'";
const SUNE = "R U R' U R U2 R' U";
const CORNERS = "U R U' L' U R' U' L";
const TWIST = "R' D' R D";
const rep = (alg, n) => Array(n).fill(alg).join(' ');
const ONLY_Y = ['UF', 'UR', 'UB', 'UL'].map((p) => ({ piece: p, only: 'U' }));

export const COURSE = [
  {
    id: 'mulai',
    title: 'Kenali kubus & mulai dari acak',
    short: 'Jenis keping, warna, cara membaca gerakan, dan langkah pertama.',
    intro: true,
  },
  {
    id: 'daisy',
    key: 'daisy',
    title: 'Bunga',
    short: 'Kumpulkan 4 edge putih di sekitar tengah kuning.',
    goal: {
      text: 'Tengah KUNING di atas, dikelilingi 4 edge yang warna PUTIH-nya menghadap ke atas — seperti bunga dengan 4 kelopak putih.',
      ctx: ['centers'],
      put: [['DF', 'D', 'UF', 'U'], ['DR', 'D', 'UR', 'U'], ['DB', 'D', 'UB', 'U'], ['DL', 'D', 'UL', 'U']],
    },
    firstSteps: [
      'Cari tengah KUNING, pegang di atas. Tengah tidak pernah pindah, jadi kuning akan selalu di atas.',
      'Cari keping EDGE (2 warna) yang punya warna putih. Jumlahnya selalu 4.',
      'Mulai dari edge yang paling gampang: yang ada di lapisan tengah atau di bawah.',
      'Naikkan satu per satu dengan kasus di bawah sampai ada 4 kelopak putih di atas.',
    ],
    cases: [
      {
        title: 'Edge putih di lapisan tengah, putih menghadap ke depan',
        ctx: ['centers'], put: [['DF', 'D', 'FR', 'F']], focus: ['FR'],
        parts: [{ label: 'Naikkan', moves: 'R' }],
        result: 'Sisi kanan diputar ke atas: edge naik dan warna putihnya menghadap atas. Jadi kelopak pertama!',
      },
      {
        title: 'Edge putih di lapisan tengah, putih menghadap ke samping',
        ctx: ['centers'], put: [['DF', 'D', 'FR', 'R']], focus: ['FR'],
        parts: [{ label: 'Naikkan', moves: "F'" }],
        result: 'Kali ini yang diputar sisi depan (berlawanan jarum jam). Aturannya: putar sisi yang TIDAK ada putihnya, ke arah atas.',
      },
      {
        title: 'Edge di bawah, putih menghadap ke bawah',
        ctx: ['centers'], put: [['DF', 'D', 'DF', 'D']], focus: ['DF'], view: 'bottom',
        parts: [{ label: 'Putar 2x', moves: 'F2' }],
        result: 'Putar sisi depan 2x: edge pindah dari bawah ke atas dan putihnya langsung menghadap atas.',
      },
      {
        title: 'Edge di bawah, putih menghadap ke samping',
        ctx: ['centers'], put: [['DF', 'D', 'DF', 'F']], focus: ['DF'],
        parts: [{ label: 'Pindah ke tengah', moves: 'F' }, { label: 'Naikkan', moves: "L'" }],
        result: 'Putar depan sekali dulu: sekarang edge ada di lapisan tengah. Lalu naikkan seperti kasus pertama.',
      },
      {
        title: 'Edge sudah di atas, tapi putihnya menghadap ke samping',
        ctx: ['centers'], put: [['DF', 'D', 'UF', 'F']], focus: ['UF'],
        parts: [{ label: 'Turunkan ke tengah', moves: 'F' }, { label: 'Kosongkan tempat', moves: "U'" }, { label: 'Naikkan', moves: 'R' }],
        result: 'Edge yang "terbalik" diturunkan dulu ke lapisan tengah, lalu dinaikkan lagi dengan putih menghadap atas.',
      },
      {
        title: 'Tempat di atas sudah ada kelopak',
        ctx: ['centers'], put: [['DF', 'D', 'FR', 'F'], ['DR', 'D', 'UR', 'U']], focus: ['FR', 'UR'],
        parts: [{ label: 'Geser kelopak', moves: 'U' }, { label: 'Naikkan', moves: 'R' }],
        result: 'Kalau R langsung, kelopak yang sudah jadi akan jatuh. Putar U dulu supaya tempat di atas edge kosong.',
      },
    ],
    mistakes: [
      'Memutar sisi atas tanpa sengaja tidak apa-apa — kelopak tetap di atas.',
      'Sebelum menaikkan edge, selalu cek tempat tujuannya di atas masih kosong.',
      'Kelopak tidak perlu cocok dengan warna samping dulu. Itu urusan tahap berikutnya.',
    ],
    algs: [],
  },
  {
    id: 'cross',
    key: 'cross',
    title: 'Silang Putih',
    short: 'Turunkan kelopak ke bawah dengan warna samping yang cocok.',
    goal: {
      text: 'Tanda PLUS putih di bawah, dan warna samping tiap edge sama dengan tengah di atasnya (hijau dengan hijau, merah dengan merah, dst).',
      ctx: ['centers', 'cross'], view: 'bottom',
    },
    firstSteps: [
      'Mulai dari bunga. Pegang kuning tetap di atas.',
      'Pilih satu kelopak. Lihat warna SAMPINGNYA (bukan putihnya).',
      'Putar U sampai warna samping itu tepat di atas tengah yang warnanya sama.',
      'Putar sisi itu 2x. Kelopak turun ke bawah. Ulangi untuk 3 kelopak lainnya.',
    ],
    cases: [
      {
        title: 'Warna samping kelopak sudah sejajar dengan tengahnya',
        ctx: ['centers'], put: [['DF', 'D', 'UF', 'U'], ['DR', 'D', 'UL', 'U'], ['DB', 'D', 'UR', 'U'], ['DL', 'D', 'UB', 'U']], focus: ['UF'],
        parts: [{ label: 'Turunkan', moves: 'F2' }],
        result: 'Hijau di kelopak sudah di atas tengah hijau, jadi langsung putar depan 2x.',
      },
      {
        title: 'Warna samping belum sejajar',
        ctx: ['centers'], put: [['DF', 'D', 'UR', 'U'], ['DR', 'D', 'UB', 'U'], ['DB', 'D', 'UL', 'U'], ['DL', 'D', 'UF', 'U']], focus: ['UR'],
        parts: [{ label: 'Sejajarkan', moves: 'U' }, { label: 'Turunkan', moves: 'F2' }],
        result: 'Kelopak hijau ada di kanan. Putar U sampai hijau ada di atas tengah hijau (depan), lalu depan 2x.',
      },
    ],
    mistakes: [
      'Yang dicocokkan warna samping kelopak dengan tengah, bukan warna putih.',
      'Putaran 2x (F2, R2, …) arahnya bebas, hasilnya sama.',
      'Setelah tahap ini, putih ada di BAWAH. Tetap pegang kuning di atas sampai selesai.',
    ],
    algs: [],
  },
  {
    id: 'corners1',
    key: 'corners1',
    title: 'Sudut Putih',
    short: 'Lengkapi lapisan pertama dengan 4 sudut putih.',
    goal: {
      text: 'Seluruh sisi bawah PUTIH, dan baris bawah di 4 sisi samping sudah satu warna dengan tengahnya.',
      ctx: ['centers', 'bottom'], view: 'bottom',
    },
    firstSteps: [
      'Cari SUDUT (3 warna) yang punya warna putih di lapisan atas.',
      'Lihat 2 warna lainnya, misal hijau & oranye. Slotnya ada di bawah, di antara tengah hijau dan tengah oranye.',
      'Putar U sampai sudut tepat di ATAS slotnya, lalu hadapkan slot itu ke kanan-depan (putar seluruh kubus bila perlu).',
      'Ulangi R U R\' U\' sampai sudut masuk dengan benar. Ulangi untuk 4 sudut.',
    ],
    cases: [
      {
        title: 'Sudut belum di atas slotnya',
        ctx: ['centers', 'cross', 'DFL', 'DBR', 'DBL'], put: [['DFR', 'D', 'UFL', 'U']], focus: ['UFL'],
        parts: [{ label: 'Ke atas slot', moves: "U'" }, { label: 'Masukkan', moves: rep(SEXY, 3) }],
        result: 'Putar U sampai sudut ada di atas slotnya (di antara hijau & oranye), lalu pakai rumus.',
      },
      {
        title: 'Putih menghadap ke kanan',
        ctx: ['centers', 'cross', 'DFL', 'DBR', 'DBL'], put: [['DFR', 'D', 'UFR', 'R']], focus: ['UFR'],
        parts: [{ label: '1x', moves: SEXY }],
        result: 'Cukup 1x R U R\' U\'.',
      },
      {
        title: 'Putih menghadap ke atas',
        ctx: ['centers', 'cross', 'DFL', 'DBR', 'DBL'], put: [['DFR', 'D', 'UFR', 'U']], focus: ['UFR'],
        parts: [{ label: '1', moves: SEXY }, { label: '2', moves: SEXY }, { label: '3', moves: SEXY }],
        result: 'Butuh 3x. Di tengah proses sudut terlihat "salah" — terus saja sampai masuk.',
      },
      {
        title: 'Putih menghadap ke depan',
        ctx: ['centers', 'cross', 'DFL', 'DBR', 'DBL'], put: [['DFR', 'D', 'UFR', 'F']], focus: ['UFR'],
        parts: [{ label: '1', moves: SEXY }, { label: '2', moves: SEXY }, { label: '3', moves: SEXY }, { label: '4', moves: SEXY }, { label: '5', moves: SEXY }],
        result: 'Butuh 5x. (Cara lebih cepat setelah lancar: F\' U\' F.)',
      },
      {
        title: 'Sudut sudah di slotnya tapi terbalik',
        ctx: ['centers', 'cross', 'DFL', 'DBR', 'DBL'], put: [['DFR', 'D', 'DFR', 'F']], focus: ['DFR'], view: 'bottom',
        parts: [{ label: '1', moves: SEXY }, { label: '2', moves: SEXY }, { label: '3', moves: SEXY }, { label: '4', moves: SEXY }],
        result: 'Hadapkan slot itu ke kanan-depan, lalu ulangi rumus yang sama (2 atau 4x) sampai putih menghadap bawah.',
      },
    ],
    mistakes: [
      'Rumus hanya bekerja kalau slot tujuan ada di KANAN-DEPAN bawah.',
      'Jumlah pengulangan selalu ganjil (1, 3, 5) untuk sudut di atas, genap (2, 4) untuk sudut yang terbalik di slotnya.',
      'Sudut di bawah tapi di slot yang salah: hadapkan ke kanan-depan, lakukan rumus 1x untuk mengeluarkannya.',
    ],
    algs: [{ name: 'Sexy move', alg: SEXY }],
  },
  {
    id: 'middle',
    key: 'middle',
    title: 'Lapisan Tengah',
    short: 'Masukkan 4 edge tanpa kuning ke lapisan tengah.',
    goal: {
      text: 'Dua lapisan bawah sudah lengkap: semua sisi samping rapi sampai baris tengah.',
      ctx: ['centers', 'f2l'],
    },
    firstSteps: [
      'Cari edge di lapisan atas yang TIDAK punya warna kuning.',
      'Putar U sampai warna depan edge sama dengan tengah di bawahnya. Bentuknya seperti huruf T terbalik.',
      'Lihat warna atas edge: sama dengan tengah KANAN atau KIRI?',
      'Pakai rumus kanan atau rumus kiri. Ulangi untuk 4 edge.',
    ],
    cases: [
      {
        title: 'Warna atas edge cocok dengan tengah kanan',
        ctx: ['centers', 'bottom', 'FL', 'BR', 'BL'], put: [['FR', 'F', 'UF', 'F']], focus: ['UF'],
        parts: [{ label: 'Rumus kanan', moves: RIGHT }],
        result: 'Edge masuk ke slot kanan-depan.',
      },
      {
        title: 'Warna atas edge cocok dengan tengah kiri',
        ctx: ['centers', 'bottom', 'FR', 'BR', 'BL'], put: [['FL', 'F', 'UF', 'F']], focus: ['UF'],
        parts: [{ label: 'Rumus kiri', moves: LEFT }],
        result: 'Edge masuk ke slot kiri-depan. Rumus kiri adalah cermin dari rumus kanan.',
      },
      {
        title: 'Edge belum membentuk huruf T',
        ctx: ['centers', 'bottom', 'FL', 'BR', 'BL'], put: [['FR', 'F', 'UR', 'R']], focus: ['UR'],
        parts: [{ label: 'Bentuk T', moves: 'U' }, { label: 'Rumus kanan', moves: RIGHT }],
        result: 'Putar U dulu sampai warna samping edge sejajar dengan tengahnya, baru pakai rumus.',
      },
      {
        title: 'Edge terjebak di slot tapi terbalik',
        ctx: ['centers', 'bottom', 'FL', 'BR', 'BL'], put: [['FR', 'F', 'FR', 'R']], focus: ['FR'],
        parts: [{ label: 'Keluarkan', moves: RIGHT }, { label: 'Bentuk T', moves: 'U2' }, { label: 'Masukkan', moves: RIGHT }],
        result: 'Keluarkan dengan rumus kanan (edge naik ke atas), cari lagi posisi T-nya, lalu masukkan dengan benar.',
      },
    ],
    mistakes: [
      'Edge yang punya warna kuning bukan untuk lapisan tengah — lewati dulu.',
      'Kalau semua edge di atas punya kuning, berarti ada edge yang terjebak terbalik di lapisan tengah.',
      'Setelah rumus, lapisan putih tetap utuh. Kalau rusak, berarti ada gerakan yang terlewat.',
    ],
    algs: [{ name: 'Rumus kanan', alg: RIGHT }, { name: 'Rumus kiri', alg: LEFT }],
  },
  {
    id: 'topcross',
    key: 'topcross',
    title: 'Silang Kuning',
    short: 'Bentuk tanda plus kuning di atas.',
    goal: {
      text: 'Tanda PLUS kuning di atas. Sudut-sudutnya belum penting (abu-abu di gambar).',
      ctx: ['centers', 'f2l', ...ONLY_Y],
    },
    firstSteps: [
      'Lihat sisi atas, abaikan sudut. Hanya hitung edge yang kuningnya menghadap atas.',
      'Kenali polanya: titik, huruf L, garis, atau sudah plus.',
      'Pegang pola sesuai posisi yang benar, lalu pakai satu rumus: F R U R\' U\' F\'.',
      'Ulangi sampai jadi plus: titik → L → garis → plus.',
    ],
    cases: [
      {
        title: 'Pola titik (hanya tengah yang kuning)',
        ctx: ['centers', 'f2l'], put: [['UF', 'U', 'UF', 'F'], ['UR', 'U', 'UR', 'R'], ['UB', 'U', 'UB', 'B'], ['UL', 'U', 'UL', 'L']], onlyYellowTop: true,
        parts: [{ label: 'Rumus', moves: FRU }],
        result: 'Muncul huruf L. Putar U supaya L ada di kiri-belakang, lalu lanjut kasus huruf L.',
      },
      {
        title: 'Pola huruf L',
        ctx: ['centers', 'f2l', ...ONLY_Y.filter((o) => o.piece === 'UB' || o.piece === 'UL')], put: [['UF', 'U', 'UF', 'F'], ['UR', 'U', 'UR', 'R']], onlyYellowTop: true,
        parts: [{ label: 'Rumus', moves: FRU }],
        result: 'Pegang L di kiri & belakang (seperti jarum jam menunjuk jam 9 dan jam 12). Hasilnya jadi garis mendatar.',
      },
      {
        title: 'Pola garis',
        ctx: ['centers', 'f2l', ...ONLY_Y.filter((o) => o.piece === 'UR' || o.piece === 'UL')], put: [['UF', 'U', 'UF', 'F'], ['UB', 'U', 'UB', 'B']], onlyYellowTop: true,
        parts: [{ label: 'Rumus', moves: FRU }],
        result: 'Pegang garis mendatar (kiri-kanan). Satu rumus langsung jadi plus!',
      },
    ],
    mistakes: [
      'Garis harus mendatar (kiri-kanan), bukan menjauh darimu.',
      'Huruf L harus di kiri-belakang. Posisi lain tidak akan jadi garis.',
      'Kalau sudut-sudut atas jadi berantakan, tidak apa-apa. Dua lapisan bawah tetap utuh.',
    ],
    algs: [{ name: 'Silang kuning', alg: FRU }],
  },
  {
    id: 'topedges',
    key: 'topedges',
    title: 'Edge Kuning',
    short: 'Cocokkan warna samping edge kuning dengan tengahnya.',
    goal: {
      text: 'Plus kuning di atas, dan warna samping keempat edge-nya cocok dengan tengah di bawahnya.',
      ctx: ['centers', 'f2l', 'topEdges'],
    },
    firstSteps: [
      'Putar U pelan-pelan dan hitung: berapa edge yang warna sampingnya cocok dengan tengahnya?',
      'Berhenti di posisi yang cocoknya paling banyak (minimal 2).',
      'Kalau 2 edge cocok bersebelahan: pegang keduanya di belakang & kanan, lalu rumus.',
      'Kalau 2 edge cocok berseberangan: lakukan rumus sekali dari mana saja, nanti jadi bersebelahan.',
    ],
    cases: [
      {
        title: '2 edge cocok, bersebelahan (belakang & kanan)',
        ctx: ['centers', 'f2l', 'topEdges'], setup: "U' R U2 R' U' R U' R'", focus: ['UB', 'UR'],
        parts: [{ label: 'Rumus', moves: SUNE }],
        result: 'Keempat edge langsung cocok.',
      },
      {
        title: '2 edge cocok, berseberangan',
        ctx: ['centers', 'f2l', 'topEdges'], setup: "U' R U2 R' U' R U' R' U R U2 R' U' R U' R' U", focus: ['UF', 'UB'],
        parts: [{ label: 'Rumus', moves: SUNE }],
        result: 'Sekarang putar U: ada 2 edge cocok yang bersebelahan. Lanjut ke kasus pertama.',
      },
      {
        title: 'Semua cocok setelah diputar',
        ctx: ['centers', 'f2l', 'topEdges'], setup: 'U',
        parts: [{ label: 'Putar atas', moves: "U'" }],
        result: 'Kadang cukup putar U saja. Selalu cek dulu sebelum pakai rumus.',
      },
    ],
    mistakes: [
      'Posisi pegang untuk kasus bersebelahan: edge yang cocok di BELAKANG dan KANAN.',
      'Rumus ini diakhiri dengan U. Jangan lupa gerakan terakhir itu.',
    ],
    algs: [{ name: 'Tukar edge (Sune + U)', alg: SUNE }],
  },
  {
    id: 'topcornerpos',
    key: 'topcornerpos',
    title: 'Posisi Sudut Kuning',
    short: 'Pindahkan sudut kuning ke tempat yang benar.',
    goal: {
      text: 'Setiap sudut atas sudah di tempatnya (3 warnanya cocok dengan 3 tengah di sekitarnya), walau mungkin masih terpelintir.',
      ctx: ['all'], setup: "U D' R' D R D' R' D R D' R' D R D' R' D R U' D' R' D R D' R' D R",
    },
    firstSteps: [
      'Cek tiap sudut atas: apakah 3 warnanya sama dengan 3 tengah di sekitarnya? Arah warnanya belum penting.',
      'Kalau ada 1 sudut yang benar: pegang di kanan-depan-atas, lalu rumus 1–2x.',
      'Kalau belum ada yang benar: rumus sekali dari mana saja, nanti ada 1 yang benar.',
    ],
    cases: [
      {
        title: '1 sudut sudah benar, di kanan-depan',
        ctx: ['all'], setup: "L' U R U' L U R' U'", focus: ['UFR'],
        parts: [{ label: 'Rumus', moves: CORNERS }],
        result: 'Tiga sudut lain berputar tempat. Semua sudut sekarang di tempatnya.',
      },
      {
        title: '1 sudut benar, tapi perlu 2x',
        ctx: ['all'], setup: "L' U R U' L U R' U' L' U R U' L U R' U'", focus: ['UFR'],
        parts: [{ label: '1', moves: CORNERS }, { label: '2', moves: CORNERS }],
        result: 'Setelah sekali belum beres? Lakukan sekali lagi dengan pegangan yang sama.',
      },
      {
        title: 'Belum ada sudut yang benar',
        ctx: ['all'], setup: "y L' U R U' L U R' U' y' L' U R U' L U R' U'",
        parts: [{ label: 'Rumus', moves: CORNERS }],
        result: 'Sekarang ada 1 sudut yang benar. Hadapkan ke kanan-depan, lanjut kasus pertama.',
      },
    ],
    mistakes: [
      'Sudut "benar" artinya warnanya cocok, arahnya belum tentu. Arah dibereskan di tahap terakhir.',
      'Sudut patokan selalu dipegang di KANAN-DEPAN-ATAS.',
    ],
    algs: [{ name: 'Putar 3 sudut', alg: CORNERS }],
  },
  {
    id: 'topcornertwist',
    key: 'topcornertwist',
    title: 'Putar Sudut Kuning',
    short: 'Langkah terakhir: putar sudut sampai kuning menghadap atas.',
    goal: { text: 'Kubus selesai! 🎉', ctx: ['all'] },
    firstSteps: [
      'Pegang kuning di atas. Pilih satu sudut yang kuningnya belum di atas, taruh di kanan-depan-atas.',
      'Ulangi R\' D\' R D sampai kuning sudut itu menghadap atas (2 atau 4x).',
      'Bagian bawah akan terlihat berantakan. JANGAN panik dan JANGAN putar seluruh kubus.',
      'Putar HANYA sisi atas (U) untuk membawa sudut berikutnya ke kanan-depan. Ulangi sampai semua beres.',
    ],
    cases: [
      {
        title: 'Kuning sudut menghadap ke kanan',
        ctx: ['centers', 'f2l', 'topEdges', 'UFL', 'UBR', 'UBL'], put: [['UFR', 'U', 'UFR', 'R']], focus: ['UFR'],
        parts: [{ label: '1', moves: TWIST }, { label: '2', moves: TWIST }],
        result: '2x. Bagian bawah memang jadi berantakan — akan kembali sendiri saat sudut lain dibereskan.',
      },
      {
        title: 'Kuning sudut menghadap ke depan',
        ctx: ['centers', 'f2l', 'topEdges', 'UFL', 'UBR', 'UBL'], put: [['UFR', 'U', 'UFR', 'F']], focus: ['UFR'],
        parts: [{ label: '1', moves: TWIST }, { label: '2', moves: TWIST }, { label: '3', moves: TWIST }, { label: '4', moves: TWIST }],
        result: '4x. Sama: abaikan bagian bawah yang berantakan.',
      },
      {
        title: 'Contoh lengkap: 2 sudut terpelintir',
        ctx: ['all'], setup: "U D' R' D R D' R' D R D' R' D R D' R' D R U' D' R' D R D' R' D R",
        parts: [
          { label: 'Sudut 1 (2x)', moves: rep(TWIST, 2) },
          { label: 'Hanya U', moves: 'U' },
          { label: 'Sudut 2 (4x)', moves: rep(TWIST, 4) },
          { label: 'Rapikan', moves: "U'" },
        ],
        result: 'Perhatikan: bagian bawah berantakan di tengah proses, lalu kembali rapi sendiri. Kubus selesai!',
      },
    ],
    mistakes: [
      'Jangan memutar seluruh kubus di tahap ini. Hanya sisi atas (U) yang boleh diputar untuk ganti sudut.',
      'Selalu selesaikan pengulangan sampai kuning sudut itu di atas, baru ganti sudut.',
      'Terakhir, putar U sampai semua sisi cocok.',
    ],
    algs: [{ name: 'Putar sudut', alg: TWIST }],
  },
];

export const QUIZ_KEYS = ['cross', 'corners1', 'middle', 'topcross', 'topedges', 'topcornerpos', 'topcornertwist'];
