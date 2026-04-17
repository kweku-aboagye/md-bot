import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { T } from '../theme';
import { Card, SectionHeader } from '../components/ui';
import { useAuth } from '../auth-context';

interface Contact {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  updatedAt: string;
}

export function Contacts() {
  const { showPinModal } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pin, setPin] = useState<string | undefined>(undefined);

  const loadContacts = useCallback(async (pinOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contacts', {
        headers: pinOverride ? { 'x-dashboard-pin': pinOverride } : {},
      });
      if (res.status === 401) {
        setLoading(false);
        showPinModal((p) => {
          setPin(p);
          loadContacts(p);
        }, pinOverride ? 'Incorrect PIN' : null);
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setContacts(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [showPinModal]);

  useEffect(() => { loadContacts(pin); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function saveWithPin(pinOverride?: string) {
    const activePin = pinOverride ?? pin;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activePin ? { 'x-dashboard-pin': activePin } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 401) {
        showPinModal((p) => { setPin(p); saveWithPin(p); }, 'Incorrect PIN');
        return;
      }
      if (!res.ok) { setFormError(data.message ?? 'Failed to save'); return; }
      setForm({ name: '', email: '', phone: '' });
      await loadContacts(activePin);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    showPinModal((p) => { setPin(p); saveWithPin(p); });
  }

  function handleDelete(email: string) {
    const doDelete = async (pinOverride?: string) => {
      const activePin = pinOverride ?? pin;
      try {
        const res = await fetch(`/api/contacts/${encodeURIComponent(email)}`, {
          method: 'DELETE',
          headers: activePin ? { 'x-dashboard-pin': activePin } : {},
        });
        if (res.status === 401) {
          showPinModal((p) => { setPin(p); doDelete(p); }, 'Incorrect PIN');
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.message ?? 'Failed to delete');
          return;
        }
        await loadContacts(activePin);
      } catch {
        alert('Failed to delete contact');
      }
    };
    showPinModal((p) => { setPin(p); doDelete(p); });
  }

  const canSave = !saving && !!form.email && !!form.phone;
  const saveButtonStyle = {
    '--button-color': canSave ? `${T.indigo}30` : T.border,
    '--button-bg': canSave ? `${T.indigo}18` : T.surface2,
    '--button-text': canSave ? T.indigo : T.muted,
    opacity: canSave ? 1 : 0.65,
  } as CSSProperties;

  return (
    <div className="stack-16">
      <Card>
        <SectionHeader accent={T.indigo} icon="📱" title="SMS Contacts" subtitle="Phone numbers for reminder texts" />

        <div className="contacts-form">
          <input
            className="contacts-input"
            placeholder="Name (optional)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className="contacts-input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <input
            className="contacts-input"
            placeholder="+1XXXXXXXXXX"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>

        {formError && (
          <div className="contacts-form-error">{formError}</div>
        )}

        <div className="action-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="run-button"
            style={saveButtonStyle}
          >
            {saving ? 'Saving…' : 'Save Contact'}
          </button>
        </div>
      </Card>

      <Card>
        {loading && <div className="state-copy">Loading…</div>}
        {error && (
          <div className="error-panel">
            <div className="error-panel__title">⚠ {error}</div>
            <button type="button" onClick={() => loadContacts(pin)} className="error-panel__action">Retry</button>
          </div>
        )}
        {!loading && !error && contacts.length === 0 && (
          <div className="state-copy">No contacts yet. Add one above.</div>
        )}
        {!loading && contacts.length > 0 && (
          <div className="status-list">
            {contacts.map((c) => (
              <div key={c.id} className="status-card">
                <div className="status-card__row">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="status-card__title">{c.name ?? c.email}</div>
                    <div className="status-card__meta">
                      {c.name && <span>{c.email}</span>}
                      <span className="contacts-phone">{c.phone}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.email)}
                    className="contacts-remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
