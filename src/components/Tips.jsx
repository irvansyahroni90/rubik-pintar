import { TIP_GROUPS } from '../content/tips.js';

export default function Tips() {
  return (
    <main className="screen">
      <div>
        <h1>Tips & trik</h1>
        <p className="muted" style={{ marginTop: 6 }}>Hal-hal kecil yang bikin rubikmu lebih cepat beres.</p>
      </div>
      {TIP_GROUPS.map((g) => (
        <section key={g.title} className="list">
          <h3>{g.title}</h3>
          {g.items.map((t) => (
            <div key={t.title} className="panel tip-item">
              <span className="em" aria-hidden="true">{t.em}</span>
              <div><b>{t.title}</b><p className="muted small" style={{ marginTop: 2 }}>{t.text}</p></div>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
