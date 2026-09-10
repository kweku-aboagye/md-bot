import { useEffect, useState, type CSSProperties } from 'react';
import { T, countdownLabel, formatDeadline, formatServiceDate, formatServiceDateShort } from './theme';
import { Contacts } from './pages/Contacts';
import { Overview } from './pages/Overview';
import { Schedule } from './pages/Schedule';

interface PrepCycle {
  sunday: string;
  deadline: string;
  teamRehearsal: string;
}

interface CycleInfo {
  targetSunday: string;
  collecting: PrepCycle | null;
  daysUntilDeadline: number | null;
  locked: PrepCycle;
}

// First-paint fallback only — the server is the source of truth (see
// getTargetSunday in server/core/scheduling/target-sunday.ts). The collecting
// window opens on Thursday, 17 days before its service, and closes at the
// Wednesday band rehearsal 11 days before it.
function fallbackTargetSunday(): string {
  const CT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const ct = new Date(Date.now() - CT_OFFSET_MS);
  const sinceOpen = (ct.getUTCDay() - 4 + 7) % 7;
  ct.setUTCDate(ct.getUTCDate() + 17 - sinceOpen);
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
  const [cycle, setCycle] = useState<CycleInfo | null>(null);
  const targetSunday = cycle?.targetSunday ?? fallbackTargetSunday();
  const brandStyle = {
    background: `linear-gradient(135deg, ${T.indigo}, ${T.purple})`,
  } satisfies CSSProperties;

  useEffect(() => {
    fetch('/api/schedule')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.locked) setCycle(data as CycleInfo);
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

          {cycle ? (
            <div className="app-cycles">
              {cycle.collecting ? (
                <div className="app-cycle" style={{ '--accent-color': T.indigo } as CSSProperties}>
                  <span className="app-cycle__label">Collecting</span>
                  <span className="app-cycle__date">{formatServiceDate(cycle.collecting.sunday)}</span>
                  <span className="app-cycle__meta">
                    due {formatDeadline(cycle.collecting.deadline)} ·{' '}
                    <b>{countdownLabel(cycle.daysUntilDeadline ?? 0)}</b>
                  </span>
                </div>
              ) : (
                <div className="app-cycle" style={{ '--accent-color': T.muted } as CSSProperties}>
                  <span className="app-cycle__label">Collecting</span>
                  <span className="app-cycle__date">Opens Thursday</span>
                  <span className="app-cycle__meta">next Sunday's songs</span>
                </div>
              )}

              <div className="app-cycle" style={{ '--accent-color': T.purple } as CSSProperties}>
                <span className="app-cycle__label">Locked</span>
                <span className="app-cycle__date">{formatServiceDate(cycle.locked.sunday)}</span>
                <span className="app-cycle__meta">
                  rehearsal {formatServiceDateShort(cycle.locked.teamRehearsal)}
                </span>
              </div>
            </div>
          ) : (
            <div className="app-target-date">
              Target —{' '}
              <span className="app-target-date-value">{formatServiceDate(targetSunday)}</span>
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
