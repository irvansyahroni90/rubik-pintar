// Nama sisi & tetangganya pada foto/jaring (urutan sisi: U R F D L B)
export const FACE_TITLE = ['Atas', 'Kanan', 'Depan', 'Bawah', 'Kiri', 'Belakang'];
// [atas, kanan, bawah, kiri] dari tiap sisi seperti terlihat di foto
export const NEIGHBORS = [
  [5, 1, 2, 4], // Atas: belakang di atas foto, depan di bawah
  [0, 5, 3, 2], // Kanan
  [0, 1, 3, 4], // Depan
  [2, 1, 5, 4], // Bawah: depan di atas foto
  [0, 2, 3, 5], // Kiri
  [0, 4, 3, 1], // Belakang
];
