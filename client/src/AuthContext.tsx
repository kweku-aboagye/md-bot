import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { T } from './theme';
import { AuthContext } from './auth-context';

// ── PIN modal ─────────────────────────────────────────────────────────────────
function PinModal({ onSubmit, onCancel, error }: {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error: string | null;
}) {
  const [value, setValue] = useState('');
  const [confirmHovered, setConfirmHovered] = useState(false);
  const [confirmPressed, setConfirmPressed] = useState(false);
  const [cancelHovered, setCancelHovered] = useState(false);
  const [cancelPressed, setCancelPressed] = useState(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        padding: '28px 32px', width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>🔐</div>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: T.text }}>
          Enter your PIN
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: T.muted }}>
          Only the music director can trigger automations.
        </p>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && value && onSubmit(value)}
          placeholder="PIN"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: T.surface2, border: `1px solid ${error ? T.red : T.border}`,
            borderRadius: 8, padding: '10px 12px', fontSize: 16,
            color: T.text, outline: 'none', letterSpacing: '0.2em',
            marginBottom: error ? 8 : 20,
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: T.red, marginBottom: 14 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => value && onSubmit(value)}
            disabled={!value}
            onMouseEnter={() => setConfirmHovered(true)}
            onMouseLeave={() => {
              setConfirmHovered(false);
              setConfirmPressed(false);
            }}
            onMouseDown={() => value && setConfirmPressed(true)}
            onMouseUp={() => setConfirmPressed(false)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
              background: !value ? T.indigo : confirmPressed ? T.indigo + 'CC' : confirmHovered ? T.indigo + 'E6' : T.indigo,
              color: '#fff', fontWeight: 700,
              fontSize: 14, cursor: value ? 'pointer' : 'default',
              opacity: value ? 1 : 0.5, transform: confirmPressed ? 'translateY(1px)' : 'translateY(0)',
              boxShadow: confirmHovered && value ? '0 0 0 3px rgba(99, 102, 241, 0.18)' : 'none',
              transition: 'background 0.15s, transform 0.08s, box-shadow 0.15s',
            }}
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            onMouseEnter={() => setCancelHovered(true)}
            onMouseLeave={() => {
              setCancelHovered(false);
              setCancelPressed(false);
            }}
            onMouseDown={() => setCancelPressed(true)}
            onMouseUp={() => setCancelPressed(false)}
            style={{
              padding: '9px 16px', borderRadius: 8,
              border: `1px solid ${cancelHovered ? T.muted : T.border}`,
              background: cancelPressed ? T.surface2 : cancelHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
              color: T.muted, fontSize: 14, cursor: 'pointer',
              transform: cancelPressed ? 'translateY(1px)' : 'translateY(0)',
              boxShadow: cancelHovered ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
              transition: 'background 0.15s, border-color 0.15s, transform 0.08s, box-shadow 0.15s',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [pinRequired, setPinRequired] = useState(false);
  const [modalCallback, setModalCallback] = useState<((pinOverride?: string) => void) | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Fetch whether PIN is required from server
  useEffect(() => {
    fetch('/api/auth/config')
      .then(r => r.json())
      .then((d: { pinRequired: boolean }) => setPinRequired(d.pinRequired))
      .catch(() => {}); // If unreachable yet, stays false; RunButton auto-retries
  }, []);

  const showPinModal = useCallback((onSuccess: (pinOverride?: string) => void, errorMessage?: string | null) => {
    // If no PIN required, run immediately
    if (!pinRequired) { onSuccess(); return; }
    setPinError(errorMessage ?? null);
    setModalCallback(() => onSuccess);
  }, [pinRequired]);

  async function handlePinSubmit(entered: string) {
    // Use the submitted PIN immediately for this request only.
    setPinError(null);
    setModalCallback(null);
    modalCallback?.(entered);
  }

  function handleCancel() {
    setModalCallback(null);
    setPinError(null);
  }

  return (
    <AuthContext.Provider value={{ pinRequired, showPinModal }}>
      {children}
      {modalCallback && (
        <PinModal
          onSubmit={handlePinSubmit}
          onCancel={handleCancel}
          error={pinError}
        />
      )}
    </AuthContext.Provider>
  );
}
