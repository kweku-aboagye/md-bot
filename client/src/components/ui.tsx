import { useState, type CSSProperties, type ReactNode } from 'react';
import { T } from '../theme';
import { useAuth } from '../auth-context';

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
  style = {},
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ accent, icon, title, subtitle }: {
  accent: string; icon: string; title: string; subtitle?: string;
}) {
  const accentStyle = {
    background: `${accent}22`,
    border: `1px solid ${accent}30`,
  } satisfies CSSProperties;

  return (
    <div className="section-header">
      <div className="section-header__icon" style={accentStyle}>{icon}</div>
      <div className="section-header__copy">
        <div className="section-header__title">{title}</div>
        {subtitle && <div className="section-header__subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color, bg, label }: { color: string; bg: string; label: string }) {
  const badgeStyle = {
    '--badge-color': color,
    '--badge-bg': bg,
  } as CSSProperties;

  return (
    <span className="badge" style={badgeStyle}>{label}</span>
  );
}

// ── StatusDot ─────────────────────────────────────────────────────────────────
export function StatusDot({ ok }: { ok: boolean }) {
  const dotStyle = {
    '--status-dot-color': ok ? T.green : T.red,
  } as CSSProperties;

  return (
    <span className="status-dot" style={dotStyle} />
  );
}

// ── SheetLink ─────────────────────────────────────────────────────────────────
export function SheetLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="link-chip">
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
  const color = colors[state];
  const buttonStyle = {
    '--button-color': disabled ? `${T.border}` : `${color}30`,
    '--button-bg': disabled ? T.surface2 : `${color}18`,
    '--button-text': disabled ? T.muted : color,
    opacity: disabled ? 0.65 : 1,
  } as CSSProperties;

  return (
    <div className="run-button-wrap">
      <button
        type="button"
        onClick={handleRun}
        disabled={disabled || state === 'running'}
        className="run-button"
        style={buttonStyle}
      >
        {state === 'running' ? 'Running…' : state === 'done' ? '✓ Done' : state === 'error' ? '✗ Error' : label}
      </button>
      {msg && (
        <span
          className="run-button-message"
          style={{ color: state === 'error' ? T.red : T.green }}
        >
          {msg}
        </span>
      )}
    </div>
  );
}

// ── LoadingState / ErrorState ─────────────────────────────────────────────────
export function LoadingState() {
  return (
    <div className="state-copy">Loading…</div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-panel">
      <div className="error-panel__title">⚠ {message}</div>
      <button type="button" onClick={onRetry} className="error-panel__action">
        Retry
      </button>
    </div>
  );
}
