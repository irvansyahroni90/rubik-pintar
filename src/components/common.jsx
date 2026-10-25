import { STICKER_HEX } from '../three/CubeView.jsx';

export const COLOR_LABEL = ['Putih', 'Kuning', 'Merah', 'Oranye', 'Hijau', 'Biru'];

export function TopBar({ title, sub, onBack, right }) {
  return (
    <div className="topbar">
      {onBack && <button className="btn icon-btn" onClick={onBack} aria-label="Kembali">←</button>}
      <div className="title">
        <h2>{title}</h2>
        {sub && <small>{sub}</small>}
      </div>
      {right}
    </div>
  );
}

export function Logo() {
  const cols = [2, 1, 4, 5, 0, 3, 1, 4, 2];
  return (
    <div className="logo" aria-hidden="true">
      {cols.map((c, i) => <i key={i} style={{ background: STICKER_HEX[c] }} />)}
    </div>
  );
}

export function MiniGrid({ n }) {
  return (
    <span className="mini-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden="true">
      {Array.from({ length: n * n }, (_, i) => <i key={i} />)}
    </span>
  );
}

export function SizePicker({ N, setN }) {
  return (
    <div className="size-picker" role="group" aria-label="Ukuran kubus">
      {[2, 3, 4, 5].map((n) => (
        <button key={n} aria-pressed={N === n} onClick={() => setN(n)}>
          <MiniGrid n={n} />
          {n}x{n}
        </button>
      ))}
    </div>
  );
}

export function Loader({ text }) {
  const cols = [2, 3, 1, 4, 5, 0, 1, 2, 4];
  return (
    <div className="loader" role="status">
      <div className="spin-cube">{cols.map((c, i) => <i key={i} style={{ background: STICKER_HEX[c] }} />)}</div>
      <b>{text}</b>
    </div>
  );
}

export function Confetti() {
  const cols = [0, 1, 2, 3, 4, 5];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 48 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: STICKER_HEX[cols[i % 6]], animationDelay: `${(i % 12) * 0.08}s`, transform: `rotate(${i * 23}deg)` }} />
      ))}
    </div>
  );
}
