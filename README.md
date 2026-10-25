# 🧊 Rubik Pintar

Aplikasi web (PWA) untuk **belajar dan menyelesaikan rubik 2x2 sampai 5x5** — lengkap dengan animasi 3D, penjelasan langkah demi langkah berbahasa Indonesia, serta tips & trik.

Foto keenam sisi rubikmu → aplikasi mengenali warnanya → kamu memilih arah pegang (warna atas & warna yang menghadapmu) → ikuti animasi tahap demi tahap sesuai kondisi kubusmu saat itu.

## Fitur

- **Scan kamera 6 sisi** dengan panduan arah putar (kubus mini beranimasi), pratinjau warna langsung, dan cadangan unggah foto.
- **Pengenalan warna** dengan pencocokan berkapasitas (setiap warna tepat N×N stiker) + editor stiker untuk koreksi manual.
- **Validasi kubus**: mendeteksi sudut terpelintir, edge terbalik, dan parity yang mustahil (tanda salah scan).
- **Pilih arah pegang**: tentukan warna atas & warna depan. Kubus ganjil diputar dulu (x/y/z), kubus genap membangun center sesuai pilihanmu.
- **Solver langkah demi langkah** dengan penjelasan per langkah, sorotan keping yang sedang dikerjakan, label sisi, dan arti setiap gerakan.

| Ukuran | Metode yang bisa dipakai solver |
| --- | --- |
| 2x2 | Pemula (lapisan), Ortega |
| 3x3 | Pemula (lapisan, 8 tahap), CFOP 4-Look, CFOP Penuh (OLL 57 + PLL 21) |
| 4x4 | Reduksi (center → pairing edge → 3x3) + Pemula/CFOP, termasuk OLL & PLL parity |
| 5x5 | Reduksi + Pemula/CFOP, termasuk parity edge 5x5 |

- **Belajar**: materi per ukuran & metode, setiap rumus bisa dianimasikan.
- **Ensiklopedia metode**: Pemula, CFOP, Roux, ZZ, Petrus, Ortega, CLL/EG, Reduksi, Yau, Hoya.
- **Notasi interaktif** (R, U', 2R, Rw, M, x/y/z, dst.) dan **Tips & trik**.
- **Latihan acak**: acakan resmi untuk kubus aslimu, lalu ikuti solusinya.
- **PWA**: bisa dipasang di layar utama HP dan berjalan offline.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di folder dist/
npm test           # ribuan acakan acak diuji: semua harus terselesaikan
```

Kamera butuh **HTTPS** (atau `localhost`). GitHub Pages sudah HTTPS.

## Online di GitHub Pages

Aplikasi: **https://irvansyahroni90.github.io/rubik-pintar/**

Setiap push ke branch `main` otomatis menjalankan tes, build, lalu deploy lewat GitHub Actions (`.github/workflows/deploy.yml`). Pengaturan yang dibutuhkan sekali saja: *Settings → Pages → Source: GitHub Actions*.

Untuk memasang di HP: buka alamat di atas di Chrome → menu ⋮ → *Tambahkan ke layar utama*.

## Struktur

```
src/
  core/
    cube.js          mesin kubus NxN (facelet), parser notasi, scramble
    pieces.js        akses keping (sudut/edge/center) per posisi
    scheme.js        skema warna, arah pegang, validasi hasil scan
    notation.js      arti gerakan dalam bahasa Indonesia
    solver/
      index.js       pemilih metode & verifikasi solusi
      lbl.js         metode pemula (bunga, silang, sudut, lapisan tengah, lapisan atas)
      cfop.js        cross optimal (tabel BFS), F2L intuitif, OLL/PLL
      two.js         2x2: pemula & Ortega
      bigcube.js     4x4/5x5: center (pencarian + komutator), pairing edge, parity
      algs.js        tabel rumus (divalidasi otomatis oleh tes)
  scan/colors.js     sampling foto & klasifikasi warna
  three/CubeView.jsx kubus 3D (Three.js) dengan animasi lapisan
  components/        layar aplikasi (Beranda, Scan, Editor, Setup, Player, Belajar, …)
  content/           materi belajar, metode, tips
tests/               tes otomatis solver, rumus, validasi, & deteksi warna
```

## Cara kerja singkat solver

- **Pemula 3x3**: tiap tahap memakai aturan yang sama seperti buku panduan (rumus `R U R' U'`, `U R U' R' U' F' U F`, `F R U R' U' F'`, `R U R' U R U2 R' U`, `U R U' L' U R' U' L`, `R' D' R D`), sehingga yang tampil adalah langkah yang benar-benar bisa dipelajari, bukan solusi komputer yang sulit diikuti.
- **CFOP**: cross dicari optimal dengan tabel BFS; F2L memakai "pemicu" pendek (R U R', F' U' F, …) dengan tabel jarak; OLL/PLL dikenali dengan mencoba setiap rumus + AUF.
- **4x4/5x5**: center disusun keping per keping (pencarian pendek, atau komutator 3-siklus bila perlu), edge dipasangkan dengan pola *slice–flip–slice*, lalu diselesaikan seperti 3x3 dengan penanganan parity.
- Setiap solusi **disimulasikan ulang** sebelum ditampilkan; jika hasil akhirnya tidak rapi, aplikasi memberi tahu bahwa kemungkinan ada salah scan.
