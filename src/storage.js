// Penyimpanan lokal sederhana (aman bila localStorage tidak tersedia)
const PREFIX = 'rubikpintar:';
export function load(key, fallback) {
  try { const v = localStorage.getItem(PREFIX + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
}
export function save(key, value) {
  try { if (value === undefined || value === null) localStorage.removeItem(PREFIX + key); else localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* abaikan */ }
}
