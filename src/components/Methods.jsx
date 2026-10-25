import { TopBar } from './common.jsx';
import { METHOD_LIBRARY } from '../content/methods.js';

export default function Methods({ onBack }) {
  return (
    <main className="screen full">
      <TopBar title="Semua metode" sub="Pilih jalur belajarmu" onBack={onBack} />
      <p className="muted">Kamu sedang di jalur pemula — urutan yang disarankan: Pemula → CFOP 4-Look → CFOP penuh. Metode bertanda “ada di solver” bisa langsung dipakai untuk menyelesaikan kubus hasil scan.</p>
      <div className="list">
        {METHOD_LIBRARY.map((m) => (
          <article key={m.id} className="panel method-card">
            <h3>{m.name}</h3>
            <div className="facts">
              <span>{m.sizes}</span><span>{m.level}</span><span>{m.algs}</span><span>{m.moves}</span>
              {m.solver && <span className="solver">✓ ada di solver</span>}
            </div>
            <p className="muted small">{m.desc}</p>
            <div className="pc">
              <div><b>Kelebihan</b><ul>{m.pros.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
              <div><b>Tantangan</b><ul>{m.cons.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
            </div>
            <p className="small"><b>Langkah berikutnya:</b> {m.next}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
