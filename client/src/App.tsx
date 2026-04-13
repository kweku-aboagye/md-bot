import { useState } from 'react';
import { T, formatSunday } from './theme';
import { Overview } from './pages/Overview';
import { Schedule } from './pages/Schedule';

// Mirror server's getTargetSunday() from scheduler.ts exactly:
// always returns the Sunday *2 weeks out* using UTC day arithmetic.
// (If today is Sunday → 14 days; otherwise (7 - utcDay) + 7 days.)
function getTargetSunday(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0 = Sunday
  const daysUntil = day === 0 ? 14 : (7 - day) + 7;
  d.setUTCDate(d.getUTCDate() + daysUntil);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

type Tab = 'overview' | 'schedule';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'schedule',   label: 'Schedule' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const targetSunday = getTargetSunday();

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: T.bg, minHeight: "100vh", padding: "28px 16px",
      color: T.text,
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${T.indigo}, ${T.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>🎶</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>
                MD Bot 🤖
              </h1>
              <div style={{ fontSize: 13, color: T.muted }}>ICGC Praise Temple · Music Director Dashboard</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: T.muted }}>
            Target Sunday —{" "}
            <span style={{ color: T.faint, fontWeight: 600 }}>{formatSunday(targetSunday)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 22,
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: 4, width: "fit-content",
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "6px 18px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              background: tab === t.id ? T.surface2 : "transparent",
              color: tab === t.id ? T.text : T.muted,
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview'   && <Overview targetSunday={targetSunday} />}
        {tab === 'schedule'   && <Schedule />}
      </div>
    </div>
  );
}
