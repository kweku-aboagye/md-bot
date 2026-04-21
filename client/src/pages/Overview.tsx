import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { T, LINKS, formatServiceDate } from '../theme';
import {
  Card, SectionHeader, Badge, StatusDot,
  SheetLink, RunButton, LoadingState, ErrorState,
} from '../components/ui';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PwSection {
  name: string;
  leaderEmail: string | null;
  songs: Array<{ title: string; youtubeUrl?: string | null }>;
}
interface PwService { label?: string; sections: PwSection[] }
interface PwStatus  { targetSunday: string; services: PwService[] }

interface CelestialStatus { hymnSelected: boolean; emailSent: boolean }
interface HghSelectionStatus { songSelected: boolean; targetSunday: string }

interface GapSong { title: string; url?: string | null }
interface HghStatus {
  totalPlaylistSongs: number;
  ministeredTitles: string[];
  unministeredSongs: GapSong[];
  suggestedNext: GapSong | null;
}

// Fix: server returns `youtubeUrl`, not `url`
interface ZamarSong { title: string; youtubeUrl?: string | null; group: string; section?: string | null }
interface ZamarStatus { songs: ZamarSong[]; emailSent: boolean }

// ── useFetch ──────────────────────────────────────────────────────────────────
// Auto-retries up to 8 times with exponential backoff when the server isn't
// ready yet (ECONNREFUSED / network error on startup race).
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (attempt = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Server error ${res.status}`);
      }
      setData(await res.json());
      setLoading(false);
    } catch (e: unknown) {
      const isNetworkErr = e instanceof TypeError; // fetch() network failure = server not up yet
      if (isNetworkErr && attempt < 8) {
        const delay = Math.min(500 * 2 ** attempt, 8000);
        setTimeout(() => load(attempt + 1), delay);
      } else {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

// ── Derive per-section status ─────────────────────────────────────────────────
function sectionStatus(sec: PwSection): 'complete' | 'missing_links' | 'missing_leader' | 'missing_songs' {
  if (!sec.leaderEmail) return 'missing_leader';
  if (sec.songs.length === 0) return 'missing_songs';
  if (sec.songs.some(s => !s.youtubeUrl)) return 'missing_links';
  return 'complete';
}

// ── Panel 1: P&W ─────────────────────────────────────────────────────────────
function PWPanel({ targetSunday }: { targetSunday: string }) {
  const { data, loading, error, reload } = useFetch<PwStatus>('/api/pw/status');

  const statusMap = {
    complete:       { color: T.green,  bg: T.greenDim,  label: "Complete" },
    missing_links:  { color: T.amber,  bg: T.amberDim,  label: "Missing Links" },
    missing_leader: { color: T.red,    bg: T.redDim,    label: "No Leader" },
    missing_songs:  { color: T.red,    bg: T.redDim,    label: "No Songs" },
  };

  const sections = data?.services?.flatMap(svc => svc.sections) ?? [];
  const complete = sections.filter(s => sectionStatus(s) === 'complete').length;
  const remindersSatisfied = sections.length > 0 && complete === sections.length;
  const subtitle = loading
    ? 'Loading…'
    : data
      ? sections.length > 0
        ? `${complete}/${sections.length} sections ready`
        : 'No service data found'
      : 'Loading…';

  return (
    <Card>
      <SectionHeader
        accent={T.indigo} icon="🎵" title="Praise & Worship"
        subtitle={subtitle}
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && sections.length === 0 && (
        <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>
          No service data found for {formatServiceDate(targetSunday)}
        </div>
      )}
      {data && sections.length > 0 && (
        <div className="status-list">
          {sections.map(sec => {
            const st = sectionStatus(sec);
            const s = statusMap[st];
            const missingLinks = sec.songs.filter(song => !song.youtubeUrl).map(song => song.title);
            return (
              <div key={sec.name} className="status-card">
                <div className="status-card__row">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="status-card__title">{sec.name}</div>
                    <div className="status-card__meta">
                      {sec.leaderEmail
                        ? <><StatusDot ok={true} />{sec.leaderEmail}</>
                        : <><StatusDot ok={false} /><span style={{ color: T.red }}>No leader</span></>}
                    </div>
                  </div>
                  <Badge color={s.color} bg={s.bg} label={s.label} />
                </div>
                {missingLinks.length > 0 && (
                  <div className="status-card__note" style={{ color: T.amber }}>
                    Missing links: {missingLinks.join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="action-row">
        <SheetLink href={LINKS.pw} label="Open P&W Doc" />
        <RunButton route="/api/test/pw-reminder" label="Send Reminder" onDone={reload} disabled={remindersSatisfied} />
      </div>
    </Card>
  );
}

// ── Panel 2: Celestial ────────────────────────────────────────────────────────
function CelestialPanel({ targetSunday }: { targetSunday: string }) {
  const { data, loading, error, reload } = useFetch<CelestialStatus>('/api/celestial/status');
  const subtitle = loading
    ? 'Loading…'
    : data
      ? data.hymnSelected
        ? `Hymn selected for ${formatServiceDate(targetSunday)}`
        : `No hymn selected for ${formatServiceDate(targetSunday)}`
      : 'Loading…';

  return (
    <Card>
      <SectionHeader accent={T.purple} icon="🎼" title="Celestial Choir" subtitle={subtitle} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div
          className="status-card status-card--highlight"
          style={{ '--status-color': data.hymnSelected ? T.green : T.amber } as CSSProperties}
        >
          {data.hymnSelected ? (
            <div className="status-card__title" style={{ color: T.green }}>
              <StatusDot ok={true} />Hymn selected ✓
            </div>
          ) : (
            <div className="status-card__title" style={{ color: T.amber }}>
              <StatusDot ok={false} />No hymn selected for {formatServiceDate(targetSunday)}
            </div>
          )}
        </div>
      )}
      <div className="action-row">
        <SheetLink href={LINKS.celestial} label="Open Celestial Sheet" />
        <RunButton route="/api/test/celestial-reminder" label="Send Reminder" onDone={reload} disabled={!!data?.hymnSelected} />
      </div>
    </Card>
  );
}

// ── Panel 3: HGH Selection ────────────────────────────────────────────────────
function HGHSelectionPanel({ targetSunday }: { targetSunday: string }) {
  const { data, loading, error, reload } = useFetch<HghSelectionStatus>('/api/hgh-selection/status');
  const subtitle = loading
    ? 'Loading…'
    : data
      ? data.songSelected
        ? `Song selected for ${formatServiceDate(targetSunday)}`
        : `No song selected for ${formatServiceDate(targetSunday)}`
      : 'Loading…';

  return (
    <Card>
      <SectionHeader accent={T.amber} icon="✨" title="His Glory Heralds" subtitle={subtitle} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div
          className="status-card status-card--highlight"
          style={{ '--status-color': data.songSelected ? T.green : T.amber } as CSSProperties}
        >
          {data.songSelected ? (
            <div className="status-card__title" style={{ color: T.green }}>
              <StatusDot ok={true} />Song selected ✓
            </div>
          ) : (
            <div className="status-card__title" style={{ color: T.amber }}>
              <StatusDot ok={false} />No song selected for {formatServiceDate(targetSunday)}
            </div>
          )}
        </div>
      )}
      <div className="action-row">
        <SheetLink href={LINKS.hgh} label="Open His Glory Heralds Sheet" />
        <SheetLink href={LINKS.hghPlaylist} label="His Glory Heralds Playlist" />
        <RunButton route="/api/test/hgh-selection-reminder" label="Send Reminder" onDone={reload} disabled={!!data?.songSelected} />
      </div>
    </Card>
  );
}

// ── Panel 4: Zamar ────────────────────────────────────────────────────────────
function ZamarPanel() {
  const { data, loading, error, reload } = useFetch<ZamarStatus>('/api/zamar/status');

  const groups = ["P&W", "HGH", "Celestial"] as const;
  const groupMeta = {
    "P&W":       { color: T.indigo, label: "Praise & Worship" },
    "HGH":       { color: T.amber,  label: "His Glory Heralds" },
    "Celestial": { color: T.purple, label: "Celestial Choir" },
  };

  return (
    <Card>
      <SectionHeader
        accent={T.teal} icon="🎹" title="Zamar Band"
        subtitle="Compiles the worship set for band prep"
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && groups.map(group => {
        const songs = data.songs.filter(s => s.group === group);
        const { color, label } = groupMeta[group];
        return (
          <div key={group} style={{ marginBottom: 14 }}>
            <div className="subsection-label" style={{ color }}>
              {label}
            </div>
            {songs.length === 0
              ? <div style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>Nothing submitted yet</div>
              : songs.map((song, i) => (
                <div key={i} className="song-row">
                  <span className="song-row__index">{i + 1}</span>
                  {song.youtubeUrl
                    ? <a href={song.youtubeUrl} target="_blank" rel="noreferrer" className="song-row__title song-row__link">
                        {song.title}
                      </a>
                    : <span className="song-row__title">{song.title}</span>
                  }
                  <div className="song-row__meta">
                    {song.section && <span className="pill">{song.section}</span>}
                    {!song.youtubeUrl && <span className="warning-copy">no link</span>}
                  </div>
                </div>
              ))
            }
          </div>
        );
      })}
      <div className="action-row">
        <SheetLink href={LINKS.zamar} label="Zamar Doc" />
        <RunButton route="/api/test/zamar-prep" label="Send Reminder" onDone={reload} />
      </div>
    </Card>
  );
}

// ── Panel 5: HGH Gap Report ───────────────────────────────────────────────────
function GapTrackerPanel() {
  const { data, loading, error, reload } = useFetch<HghStatus>('/api/hgh/status');
  const [expanded, setExpanded] = useState(false);

  const total        = data?.totalPlaylistSongs ?? 0;
  const ministered   = data?.ministeredTitles?.length ?? 0;
  const unministered = data?.unministeredSongs ?? [];
  const pct          = total > 0 ? Math.round((ministered / total) * 100) : 0;
  const visible      = expanded ? unministered : unministered.slice(0, 3);
  const progressStyle = {
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${T.green}, ${T.teal})`,
  } satisfies CSSProperties;

  return (
    <Card className="dashboard-span-full">
      <SectionHeader accent={T.yellow} icon="🔍" title="His Glory Heralds Gap Report" subtitle="Shows songs not yet ministered from the playlist" />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <div className="stat-grid" style={{ marginBottom: 18 }}>
            {[
              { label: "In Playlist",  value: total,              color: T.text },
              { label: "Ministered",   value: ministered,         color: T.green },
              { label: "Remaining",    value: unministered.length, color: T.yellow },
            ].map(stat => (
              <div key={stat.label} className="stat-card">
                <div className="stat-card__value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-card__label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="progress-track">
            <div className="progress-bar" style={progressStyle} />
          </div>

          {data.suggestedNext && (
            <div className="callout">
              <div className="callout__label">SUGGESTED NEXT</div>
              {data.suggestedNext.url
                ? <a href={data.suggestedNext.url} target="_blank" rel="noreferrer" className="callout__link">
                    {data.suggestedNext.title}
                  </a>
                : <span className="callout__title">{data.suggestedNext.title}</span>
              }
            </div>
          )}

          {unministered.length > 0 && (
            <>
              <div className="subsection-label" style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>
                Unministered Songs
              </div>
              <div className="song-list">
                {visible.map((song, i) => (
                  <div key={i} className="song-row" style={{ padding: "8px 4px" }}>
                    <span className="song-row__index" style={{ width: 22 }}>{i + 1}</span>
                    {song.url
                      ? <a href={song.url} target="_blank" rel="noreferrer" className="song-row__title song-row__link">
                          {song.title}
                        </a>
                      : <span className="song-row__title">{song.title}</span>
                    }
                  </div>
                ))}
              </div>
              {unministered.length > 3 && (
                <button type="button" onClick={() => setExpanded(e => !e)} className="ghost-button">
                  {expanded ? "Show less ↑" : `Show all ${unministered.length} songs ↓`}
                </button>
              )}
            </>
          )}
        </>
      )}

      <div className="action-row">
        <SheetLink href={LINKS.hgh} label="His Glory Heralds Sheet" />
        <SheetLink href={LINKS.hghPlaylist} label="YouTube Playlist" />
        <RunButton route="/api/test/hgh-gap-tracker" label="Send Gap Report" onDone={reload} />
      </div>
    </Card>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
export function Overview({ targetSunday }: { targetSunday: string }) {
  return (
    <div className="dashboard-grid">
      <PWPanel targetSunday={targetSunday} />
      <CelestialPanel targetSunday={targetSunday} />
      <HGHSelectionPanel targetSunday={targetSunday} />
      <ZamarPanel />
      <GapTrackerPanel />
    </div>
  );
}
