import { useEffect, useState } from 'react';
import { T } from '../theme';
import { Card, ErrorState, LoadingState, SectionHeader } from '../components/ui';

const ROWS = [
  {
    days: "Mon – Sat",
    time: "9 AM CT",
    modules: [
      "Praise & Worship Readiness Check",
      "Celestial Choir Hymn Check",
      "His Glory Heralds Song Check",
    ],
    color: T.indigo,
  },
  {
    days: "Mon – Sat",
    time: "5 PM CT",
    modules: [
      "Praise & Worship Readiness Check",
      "Celestial Choir Hymn Check",
      "His Glory Heralds Song Check",
    ],
    color: T.indigo,
  },
  { days: "Monday", time: "9 AM CT", modules: ["His Glory Heralds Gap Report"], color: T.yellow },
  { days: "Wednesday", time: "12 PM CT", modules: ["Zamar Band Prep List"], color: T.teal },
];

interface ScheduleInfo {
  adminEmail: string;
  nextRunAt: string;
  targetSunday: string;
  emailRouting: {
    pwIncomplete: string;
    pwMissingLeader: string;
    celestial: string[];
    hghSelection: string[];
    hghGap: string[];
    zamar: string[];
  };
}

function useScheduleInfo() {
  const [data, setData] = useState<ScheduleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/schedule');
        if (!res.ok) {
          throw new Error(`Server error ${res.status}`);
        }

        const body = (await res.json()) as ScheduleInfo;
        if (!active) return;

        setData(body);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function reload() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/schedule');
      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const body = (await res.json()) as ScheduleInfo;
      setData(body);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, reload };
}

export function Schedule() {
  const { data, loading, error, reload } = useScheduleInfo();
  const adminEmail = data?.adminEmail ?? 'Configured admin email';
  const emailRouting = data?.emailRouting;
  const emails = [
    { trigger: "Praise & Worship missing songs or links", freq: "Mon–Sat 2×/day", color: T.indigo, to: emailRouting?.pwIncomplete ?? "Section leader" },
    { trigger: "Praise & Worship leader missing", freq: "Mon–Sat 2×/day", color: T.red, to: emailRouting?.pwMissingLeader ?? adminEmail },
    { trigger: "Celestial Choir hymn not selected", freq: "Mon–Sat 2×/day", color: T.purple, to: emailRouting?.celestial.join(', ') ?? adminEmail },
    { trigger: "His Glory Heralds song not selected", freq: "Mon–Sat 2×/day", color: T.amber, to: emailRouting?.hghSelection.join(', ') ?? adminEmail },
    { trigger: "His Glory Heralds Gap Report", freq: "Every Monday", color: T.yellow, to: emailRouting?.hghGap.join(', ') ?? adminEmail },
    { trigger: "Zamar Band Prep List", freq: "Every Wednesday", color: T.teal, to: emailRouting?.zamar.join(', ') ?? adminEmail },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionHeader accent={T.text} icon="⏰" title="Cron Schedule" subtitle="All times Central · runs automatically, zero UI needed" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ROWS.map((row, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 14px",
              background: T.surface2, borderRadius: 9, borderLeft: `3px solid ${row.color}`,
            }}>
              <div style={{ minWidth: 90 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.days}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{row.time}</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {row.modules.map((m, j) => (
                  <span key={j} style={{
                    fontSize: 12, color: T.text, background: T.surface,
                    border: `1px solid ${T.border}`, padding: "2px 10px", borderRadius: 6,
                  }}>{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader accent={T.text} icon="📬" title="Email Routing" subtitle="Who gets emailed and when" />
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {emails.map((e, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                background: T.surface2, borderRadius: 9, borderLeft: `3px solid ${e.color}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{e.trigger}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>→ {e.to}</div>
                </div>
                <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>{e.freq}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
