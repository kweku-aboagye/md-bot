import { useState, useEffect, useCallback } from 'react';
import { T, LINKS, formatSunday } from '../theme';
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
          No service data found for {formatSunday(targetSunday)}
        </div>
      )}
      {data && sections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sections.map(sec => {
            const st = sectionStatus(sec);
            const s = statusMap[st];
            const missingLinks = sec.songs.filter(song => !song.youtubeUrl).map(song => song.title);
            return (
              <div key={sec.name} style={{
                background: T.surface2, borderRadius: 9, padding: "11px 14px",
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{sec.name}</span>
                    <span style={{ fontSize: 12, color: T.muted, marginLeft: 10 }}>
                      {sec.leaderEmail
                        ? <><StatusDot ok={true} />{sec.leaderEmail}</>
                        : <><StatusDot ok={false} /><span style={{ color: T.red }}>No leader</span></>}
                    </span>
                  </div>
                  <Badge color={s.color} bg={s.bg} label={s.label} />
                </div>
                {missingLinks.length > 0 && (
                  <div style={{ fontSize: 11, color: T.amber, marginTop: 4 }}>
                    Missing links: {missingLinks.join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
        ? `Hymn selected for ${formatSunday(targetSunday)}`
        : `No hymn selected for ${formatSunday(targetSunday)}`
      : 'Loading…';

  return (
    <Card>
      <SectionHeader accent={T.purple} icon="🎼" title="Celestial Choir" subtitle={subtitle} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div style={{
          background: T.surface2, borderRadius: 9, padding: "14px 16px",
          borderLeft: `3px solid ${data.hymnSelected ? T.green : T.amber}`,
          border: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          {data.hymnSelected ? (
            <div style={{ fontWeight: 600, fontSize: 13, color: T.green }}>
              <StatusDot ok={true} />Hymn selected ✓
            </div>
          ) : (
            <div style={{ fontWeight: 600, fontSize: 13, color: T.amber }}>
              <StatusDot ok={false} />No hymn selected for {formatSunday(targetSunday)}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
        ? `Song selected for ${formatSunday(targetSunday)}`
        : `No song selected for ${formatSunday(targetSunday)}`
      : 'Loading…';

  return (
    <Card>
      <SectionHeader accent={T.amber} icon="✨" title="His Glory Heralds" subtitle={subtitle} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div style={{
          background: T.surface2, borderRadius: 9, padding: "14px 16px",
          borderLeft: `3px solid ${data.songSelected ? T.green : T.amber}`,
          border: `1px solid ${T.border}`, marginBottom: 12,
        }}>
          {data.songSelected ? (
            <div style={{ fontWeight: 600, fontSize: 13, color: T.green }}>
              <StatusDot ok={true} />Song selected ✓
            </div>
          ) : (
            <div style={{ fontWeight: 600, fontSize: 13, color: T.amber }}>
              <StatusDot ok={false} />No song selected for {formatSunday(targetSunday)}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {label}
            </div>
            {songs.length === 0
              ? <div style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>Nothing submitted yet</div>
              : songs.map((song, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 0", borderBottom: `1px solid ${T.border}`,
                }}>
                  <span style={{ color: T.muted, fontSize: 12, width: 18, flexShrink: 0 }}>{i + 1}</span>
                  {song.youtubeUrl
                    ? <a href={song.youtubeUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 13, color: T.indigo, textDecoration: "none", flex: 1 }}>
                        {song.title}
                      </a>
                    : <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{song.title}</span>
                  }
                  {song.section && (
                    <span style={{ fontSize: 10, color: T.muted, background: T.surface2, border: `1px solid ${T.border}`, padding: "1px 7px", borderRadius: 10, flexShrink: 0 }}>
                      {song.section}
                    </span>
                  )}
                  {!song.youtubeUrl && (
                    <span style={{ fontSize: 10, color: T.amber, flexShrink: 0 }}>no link</span>
                  )}
                </div>
              ))
            }
          </div>
        );
      })}
      {/* Links: P&W Doc removed per user request */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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

  return (
    <Card style={{ gridColumn: "1 / -1" }}>
      <SectionHeader accent={T.yellow} icon="🔍" title="His Glory Heralds Gap Report" subtitle="Shows songs not yet ministered from the playlist" />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            {[
              { label: "In Playlist",  value: total,              color: T.text },
              { label: "Ministered",   value: ministered,         color: T.green },
              { label: "Remaining",    value: unministered.length, color: T.yellow },
            ].map(stat => (
              <div key={stat.label} style={{
                flex: 1, textAlign: "center", padding: "12px 8px",
                background: T.surface2, borderRadius: 9, border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 5, background: T.surface2, borderRadius: 3, marginBottom: 18, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${T.green}, ${T.teal})`, borderRadius: 3 }} />
          </div>

          {data.suggestedNext && (
            <div style={{
              background: T.yellowDim, borderLeft: `3px solid ${T.yellow}`,
              padding: "11px 16px", borderRadius: "0 9px 9px 0", marginBottom: 18,
              border: `1px solid ${T.yellow}25`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: "0.07em" }}>SUGGESTED NEXT</div>
              {data.suggestedNext.url
                ? <a href={data.suggestedNext.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 14, color: T.yellow, textDecoration: "none", fontWeight: 600 }}>
                    {data.suggestedNext.title}
                  </a>
                : <span style={{ fontSize: 14, color: T.yellow, fontWeight: 600 }}>{data.suggestedNext.title}</span>
              }
            </div>
          )}

          {unministered.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Unministered Songs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {visible.map((song, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 4px", borderBottom: `1px solid ${T.border}`,
                  }}>
                    <span style={{ color: T.muted, fontSize: 12, width: 22, flexShrink: 0 }}>{i + 1}</span>
                    {song.url
                      ? <a href={song.url} target="_blank" rel="noreferrer"
                          style={{ fontSize: 13, color: T.indigo, textDecoration: "none", flex: 1 }}>
                          {song.title}
                        </a>
                      : <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{song.title}</span>
                    }
                  </div>
                ))}
              </div>
              {unministered.length > 3 && (
                <button onClick={() => setExpanded(e => !e)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: T.indigo, fontSize: 12, marginTop: 10, padding: 0,
                }}>
                  {expanded ? "Show less ↑" : `Show all ${unministered.length} songs ↓`}
                </button>
              )}
            </>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <PWPanel targetSunday={targetSunday} />
      <CelestialPanel targetSunday={targetSunday} />
      <HGHSelectionPanel targetSunday={targetSunday} />
      <ZamarPanel />
      <GapTrackerPanel />
    </div>
  );
}
