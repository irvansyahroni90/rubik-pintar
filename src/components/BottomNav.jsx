const TABS = [
  { id: 'home', ico: '🧊', label: 'Beranda' },
  { id: 'learn', ico: '📘', label: 'Belajar' },
  { id: 'notation', ico: '🔤', label: 'Notasi' },
  { id: 'tips', ico: '💡', label: 'Tips' },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <div className="inner">
        {TABS.map((t) => (
          <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            <span className="ico" aria-hidden="true">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
