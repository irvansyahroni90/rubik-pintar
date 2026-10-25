// Ensiklopedia metode. `solver` = bisa dipakai di fitur scan & solusi aplikasi ini.
export const METHOD_LIBRARY = [
  {
    id: 'lbl', name: 'Pemula (Layer by Layer)', sizes: '2x2 · 3x3', level: 'Pemula', algs: '7 rumus', moves: '±110–170 gerakan', solver: true,
    desc: 'Menyelesaikan kubus lapis demi lapis: bunga & silang, sudut bawah, lapisan tengah, lalu lapisan atas. Ini metode resmi yang diajarkan di buku panduan Rubik.',
    pros: ['Rumus sedikit & pendek', 'Mudah dipahami logikanya'], cons: ['Gerakan banyak', 'Sulit di bawah 1 menit'],
    next: 'Kalau sudah lancar < 2 menit, lanjut ke CFOP 4-Look.',
  },
  {
    id: 'cfop', name: 'CFOP (Fridrich)', sizes: '3x3', level: 'Menengah–Mahir', algs: '16 (4-look) sampai 78 (penuh)', moves: '±55–75 gerakan', solver: true,
    desc: 'Cross → F2L → OLL → PLL. Metode paling populer di kompetisi. Bisa dipelajari bertahap: mulai 4-look, lalu tambah OLL/PLL penuh.',
    pros: ['Sangat cepat', 'Materi belajar melimpah'], cons: ['Butuh menghafal banyak rumus untuk versi penuh'],
    next: 'Kuasai F2L intuitif dulu — dampaknya paling besar untuk kecepatan.',
  },
  {
    id: 'roux', name: 'Roux', sizes: '3x3', level: 'Mahir', algs: '±42 (CMLL)', moves: '±48 gerakan',
    desc: 'Bangun blok 1x2x3 di kiri dan kanan, selesaikan 4 sudut atas (CMLL), lalu 6 edge sisa dengan gerakan M dan U.',
    pros: ['Gerakan sedikit', 'Sangat intuitif', 'Jarang memutar seluruh kubus'], cons: ['Butuh keterampilan gerakan M', 'Pembangunan blok sulit di awal'],
    next: 'Cocok untuk yang suka berpikir blok, bukan menghafal.',
  },
  {
    id: 'zz', name: 'ZZ', sizes: '3x3', level: 'Mahir', algs: 'Bervariasi (OCLL+PLL / ZBLL)', moves: '±50–60 gerakan',
    desc: 'Mulai dengan EOLine: orientasikan semua edge + buat garis di bawah. Setelah itu F2L cukup dengan R, U, L — tanpa rotasi.',
    pros: ['Ergonomis (hanya R, U, L)', 'Lapisan akhir selalu silang kuning sudah jadi'], cons: ['Tahap EOLine butuh inspeksi yang matang'],
    next: 'Bagus untuk one-handed (satu tangan).',
  },
  {
    id: 'petrus', name: 'Petrus', sizes: '3x3', level: 'Menengah', algs: '±20', moves: '±55 gerakan',
    desc: 'Bangun blok 2x2x2, perluas ke 2x2x3, perbaiki orientasi edge, lalu selesaikan dua lapisan dan lapisan terakhir.',
    pros: ['Efisien', 'Melatih pemahaman blok'], cons: ['Jarang dipakai, materi lebih sedikit'],
    next: 'Bagus untuk latihan Fewest Moves.',
  },
  {
    id: 'ortega', name: 'Ortega', sizes: '2x2', level: 'Menengah', algs: '±12', moves: '±20 gerakan', solver: true,
    desc: 'Buat satu sisi, OLL (7 kasus), lalu PBL (tukar dua lapisan sekaligus).',
    pros: ['Lompatan besar dari pemula', 'Rumus OLL sama dengan CFOP'], cons: ['Langkah pertama butuh intuisi'],
    next: 'Setelah Ortega: CLL lalu EG.',
  },
  {
    id: 'cll', name: 'CLL & EG', sizes: '2x2', level: 'Mahir', algs: '42 (CLL) – 126 (EG)', moves: '±15–18 gerakan',
    desc: 'Buat lapisan pertama utuh, lalu selesaikan lapisan atas dalam satu rumus (CLL). EG bahkan tidak perlu lapisan pertama yang rapi.',
    pros: ['Dipakai juara dunia 2x2'], cons: ['Rumus sangat banyak'],
    next: 'Untuk target di bawah 3 detik.',
  },
  {
    id: 'reduction', name: 'Reduksi', sizes: '4x4 · 5x5 · lebih besar', level: 'Pemula–Menengah', algs: '±5 + metode 3x3', moves: '±150–300 gerakan', solver: true,
    desc: 'Selesaikan semua center, pasangkan edge, lalu selesaikan seperti 3x3. Di kubus genap ada "parity" yang perlu rumus khusus.',
    pros: ['Paling mudah untuk kubus besar', 'Memakai ilmu 3x3 yang sudah ada'], cons: ['Gerakan banyak'],
    next: 'Setelah lancar, pelajari Yau (4x4) atau Hoya.',
  },
  {
    id: 'yau', name: 'Yau', sizes: '4x4 (juga 5x5)', level: 'Mahir', algs: 'Sama dengan reduksi', moves: '±130 gerakan',
    desc: 'Selesaikan 2 center berseberangan, 3 edge silang, sisa center, lalu edge sisa — sebelum tahap 3x3. Lebih sedikit rotasi kubus.',
    pros: ['Metode 4x4 favorit para juara', 'Cross sudah jadi di awal tahap 3x3'], cons: ['Urutan tahap lebih rumit'],
    next: 'Untuk 4x4 di bawah 1 menit.',
  },
  {
    id: 'hoya', name: 'Hoya', sizes: '4x4', level: 'Mahir', algs: 'Sama dengan reduksi', moves: '±130 gerakan',
    desc: 'Mirip Yau: center pertama, cross 4 edge, center sisa, lalu edge sisa.',
    pros: ['Look-ahead lebih mudah'], cons: ['Kurang populer dari Yau'],
    next: 'Alternatif bila Yau terasa sulit.',
  },
];
