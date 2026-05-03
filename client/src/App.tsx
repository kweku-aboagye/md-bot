import { useState, useEffect, type CSSProperties } from 'react';
import { T, formatServiceDate } from './theme';
import { Contacts } from './pages/Contacts';
import { Overview } from './pages/Overview';
import { Schedule } from './pages/Schedule';

// Mirror server's getTargetSunday(): two-week look-ahead using CT local time.
// Sunday → 7 days (next Sunday stays target until Monday); Mon–Sat → (7-day)+7.
function getTargetSunday(): string {
  const CT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const ct = new Date(Date.now() - CT_OFFSET_MS);
  const day = ct.getUTCDay();
  const daysUntil = day === 0 ? 7 : (7 - day) + 7;
  ct.setUTCDate(ct.getUTCDate() + daysUntil);
  ct.setUTCHours(0, 0, 0, 0);
  return new Date(ct.getTime() + CT_OFFSET_MS).toISOString().split('T')[0];
}

type Tab = 'overview' | 'schedule' | 'contacts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'schedule',  label: 'Schedule' },
  { id: 'contacts',  label: 'Contacts' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [upcomingHalfNight, setUpcomingHalfNight] = useState<string | null>(null);
  const targetSunday = getTargetSunday();
  const brandStyle = {
    background: `linear-gradient(135deg, ${T.indigo}, ${T.purple})`,
  } satisfies CSSProperties;

  useEffect(() => {
    fetch('/api/schedule')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.upcomingHalfNight) setUpcomingHalfNight(data.upcomingHalfNight);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <div className="app-container">
        <div className="app-header">
          <div className="app-brand-row">
            <div className="app-brand-icon" style={brandStyle}>🎶</div>
            <div className="app-brand-copy">
              <h1 className="app-title">MD Bot 🤖</h1>
              <div className="app-subtitle">ICGC Praise Temple · Music Director Dashboard</div>
            </div>
          </div>
          <div className="app-target-date">
            Target —{" "}
            <span className="app-target-date-value">{formatServiceDate(targetSunday)}</span>
          </div>
          {upcomingHalfNight && (
            <div className="app-target-date" style={{ color: T.amber }}>
              ⚡ Half Night —{" "}
              <span className="app-target-date-value" style={{ color: T.amber }}>
                {formatServiceDate(upcomingHalfNight)}
              </span>
            </div>
          )}
        </div>

        <div className="app-tabs" role="tablist" aria-label="Dashboard views">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`app-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview'   && <Overview targetSunday={targetSunday} />}
        {tab === 'schedule'   && <Schedule />}
        {tab === 'contacts'   && <Contacts />}
      </div>
    </div>
  );
}
