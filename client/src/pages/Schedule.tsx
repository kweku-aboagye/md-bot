import { useEffect, useState, type CSSProperties } from 'react';
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
  { days: "1st Fri / month", time: "9 PM CT", modules: ["Half Night (P&W)"], color: T.amber },
];

interface ScheduleInfo {
  adminEmail: string;
  nextRunAt: string;
  targetSunday: string;
  upcomingHalfNight: string | null;
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
    <div className="stack-16">
      <Card>
        <SectionHeader accent={T.text} icon="⏰" title="Cron Schedule" subtitle="All times Central · runs automatically, zero UI needed" />
        <div className="stack-8">
          {ROWS.map((row, i) => (
            <div
              key={i}
              className="schedule-row"
              style={{ '--accent-color': row.color } as CSSProperties}
            >
              <div className="schedule-row__time">
                <div className="schedule-row__days">{row.days}</div>
                <div className="schedule-row__clock">{row.time}</div>
              </div>
              <div className="chip-list">
                {row.modules.map((m, j) => (
                  <span key={j} className="chip">{m}</span>
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
          <div className="stack-8">
            {emails.map((e, i) => (
              <div
                key={i}
                className="routing-row"
                style={{ '--accent-color': e.color } as CSSProperties}
              >
                <div className="routing-row__copy">
                  <div className="routing-row__title">{e.trigger}</div>
                  <div className="routing-row__to">→ {e.to}</div>
                </div>
                <span className="routing-row__freq">{e.freq}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
