import { useState } from 'react';
import { T } from '../theme';
import { useAuth } from '../auth-context';

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
      padding: "20px 22px", ...style,
    }}>
      {children}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ accent, icon, title, subtitle }: {
  accent: string; icon: string; title: string; subtitle?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, background: accent + "22",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
        border: `1px solid ${accent}30`, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── StatusDot ─────────────────────────────────────────────────────────────────
export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: ok ? T.green : T.red, marginRight: 6, flexShrink: 0,
    }} />
  );
}

// ── SheetLink ─────────────────────────────────────────────────────────────────
export function SheetLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 12, color: T.indigo, textDecoration: "none",
      background: T.indigoDim, padding: "4px 10px", borderRadius: 6,
      border: `1px solid ${T.indigo}30`, marginTop: 14,
    }}>
      <span>↗</span> {label}
    </a>
  );
}

// ── RunButton ─────────────────────────────────────────────────────────────────
type RunState = 'idle' | 'running' | 'done' | 'error';

export function RunButton({ route, label = "Trigger Now", onDone, disabled = false }: {
  route: string;
  label?: string;
  onDone?: () => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<RunState>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  const { showPinModal } = useAuth();

  async function fireRequest(pinOverride?: string) {
    setState('running');
    setMsg(null);

    const controller = new AbortController();
    // Automations call Google APIs + send email — give them 45s before giving up
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (pinOverride) headers['x-dashboard-pin'] = pinOverride;

      const res = await fetch(route, { method: 'POST', headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setState('idle');
        showPinModal(fireRequest, 'Wrong PIN — try again');
        return;
      }

      if (res.ok && data.ok !== false) {
        setState('done');
        setMsg(data.message ?? null);
        onDone?.();
      } else {
        setState('error');
        setMsg(data.message ?? data.error ?? data.result?.error ?? 'Unexpected error');
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof DOMException && e.name === 'AbortError') {
        setState('error');
        setMsg('Timed out after 45s — check server logs, it may still be running');
      } else {
        setState('error');
        setMsg('Network error — is the server running?');
      }
    }
    setTimeout(() => setState('idle'), 6000);
  }

  function handleRun() {
    if (disabled) return;
    showPinModal(fireRequest);
  }

  const colors: Record<RunState, string> = {
    idle:    T.indigo,
    running: T.muted,
    done:    T.green,
    error:   T.red,
  };

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={handleRun}
        disabled={disabled || state === 'running'}
        style={{
          padding: "5px 14px", borderRadius: 7, border: `1px solid ${colors[state]}30`,
          background: disabled ? T.surface2 : colors[state] + "18",
          color: disabled ? T.muted : colors[state],
          fontSize: 12, fontWeight: 600, cursor: disabled || state === 'running' ? 'default' : 'pointer',
          transition: "all 0.15s",
          opacity: disabled ? 0.65 : 1,
        }}
      >
        {state === 'running' ? 'Running…' : state === 'done' ? '✓ Done' : state === 'error' ? '✗ Error' : label}
      </button>
      {msg && (
        <span style={{ fontSize: 11, color: state === 'error' ? T.red : T.green, marginLeft: 10 }}>
          {msg}
        </span>
      )}
    </div>
  );
}

// ── LoadingState / ErrorState ─────────────────────────────────────────────────
export function LoadingState() {
  return (
    <div style={{ fontSize: 12, color: T.muted, padding: "10px 0" }}>
      Loading…
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      background: T.redDim, border: `1px solid ${T.red}30`, borderRadius: 9,
      padding: "12px 14px", fontSize: 12,
    }}>
      <div style={{ color: T.red, fontWeight: 600, marginBottom: 6 }}>⚠ {message}</div>
      <button onClick={onRetry} style={{
        background: "none", border: `1px solid ${T.red}40`, color: T.red,
        borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer",
      }}>
        Retry
      </button>
    </div>
  );
}
