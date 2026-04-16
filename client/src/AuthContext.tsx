import { useState, useEffect, useCallback, type CSSProperties, type ReactNode } from 'react';
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
  const submitStyle = {
    background: !value ? T.indigo : confirmPressed ? `${T.indigo}CC` : confirmHovered ? `${T.indigo}E6` : T.indigo,
    cursor: value ? 'pointer' : 'default',
    opacity: value ? 1 : 0.5,
    transform: confirmPressed ? 'translateY(1px)' : 'translateY(0)',
    boxShadow: confirmHovered && value ? '0 0 0 3px rgba(99, 102, 241, 0.18)' : 'none',
  } satisfies CSSProperties;
  const cancelStyle = {
    borderColor: cancelHovered ? T.muted : T.border,
    background: cancelPressed ? T.surface2 : cancelHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
    transform: cancelPressed ? 'translateY(1px)' : 'translateY(0)',
    boxShadow: cancelHovered ? '0 0 0 3px rgba(255,255,255,0.06)' : 'none',
  } satisfies CSSProperties;

  return (
    <div className="pin-overlay">
      <div className="pin-modal">
        <div className="pin-modal__icon">🔐</div>
        <h2 className="pin-modal__title">Enter your PIN</h2>
        <p className="pin-modal__body">Only the music director can trigger automations.</p>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && value && onSubmit(value)}
          placeholder="PIN"
          className="pin-modal__input"
          style={{ borderColor: error ? T.red : T.border, marginBottom: error ? 0 : 20 }}
        />

        {error && (
          <div className="pin-modal__error">{error}</div>
        )}

        <div className="pin-modal__actions">
          <button
            type="button"
            onClick={() => value && onSubmit(value)}
            disabled={!value}
            onMouseEnter={() => setConfirmHovered(true)}
            onMouseLeave={() => {
              setConfirmHovered(false);
              setConfirmPressed(false);
            }}
            onMouseDown={() => value && setConfirmPressed(true)}
            onMouseUp={() => setConfirmPressed(false)}
            className="pin-modal__submit"
            style={submitStyle}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={onCancel}
            onMouseEnter={() => setCancelHovered(true)}
            onMouseLeave={() => {
              setCancelHovered(false);
              setCancelPressed(false);
            }}
            onMouseDown={() => setCancelPressed(true)}
            onMouseUp={() => setCancelPressed(false)}
            className="pin-modal__cancel"
            style={cancelStyle}
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
