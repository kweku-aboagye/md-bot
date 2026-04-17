import { useState, useEffect, useCallback } from 'react';
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

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setContacts(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  function handleSave() {
    showPinModal(async (pin) => {
      setSaving(true);
      setFormError(null);
      try {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(pin ? { 'x-dashboard-pin': pin } : {}),
          },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.message ?? 'Failed to save');
          if (res.status === 401) showPinModal(async (p) => handleSaveWithPin(p), 'Incorrect PIN');
          return;
        }
        setForm({ name: '', email: '', phone: '' });
        await loadContacts();
      } catch (e: unknown) {
        setFormError(e instanceof Error ? e.message : 'Failed to save');
      } finally {
        setSaving(false);
      }
    });
  }

  async function handleSaveWithPin(pin?: string) {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(pin ? { 'x-dashboard-pin': pin } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message ?? 'Failed to save'); return; }
      setForm({ name: '', email: '', phone: '' });
      await loadContacts();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(email: string) {
    showPinModal(async (pin) => {
      try {
        const res = await fetch(`/api/contacts/${encodeURIComponent(email)}`, {
          method: 'DELETE',
          headers: pin ? { 'x-dashboard-pin': pin } : {},
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.message ?? 'Failed to delete');
          return;
        }
        await loadContacts();
      } catch {
        alert('Failed to delete contact');
      }
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: '9px 12px', fontSize: 13,
    color: T.text, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Add contact */}
      <Card>
        <SectionHeader accent={T.indigo} icon="📱" title="SMS Contacts" subtitle="Phone numbers for reminder texts" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input
            style={inputStyle}
            placeholder="Name (optional)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            style={inputStyle}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <input
            style={inputStyle}
            placeholder="+1XXXXXXXXXX"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
        </div>

        {formError && (
          <div style={{ fontSize: 12, color: T.red, marginBottom: 10 }}>{formError}</div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !form.email || !form.phone}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: T.indigo, color: '#fff', fontWeight: 700,
            fontSize: 13, cursor: saving || !form.email || !form.phone ? 'default' : 'pointer',
            opacity: saving || !form.email || !form.phone ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Contact'}
        </button>
      </Card>

      {/* Contact list */}
      <Card>
        {loading && (
          <div style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '20px 0' }}>Loading…</div>
        )}
        {error && (
          <div style={{ fontSize: 13, color: T.red }}>{error}</div>
        )}
        {!loading && !error && contacts.length === 0 && (
          <div style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '20px 0' }}>
            No contacts yet. Add one above.
          </div>
        )}
        {!loading && contacts.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: T.muted, textAlign: 'left' }}>
                <th style={{ padding: '6px 10px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '6px 10px', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '6px 10px', fontWeight: 600 }}>Phone</th>
                <th style={{ padding: '6px 10px', fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 10px', color: T.text }}>{c.name ?? '—'}</td>
                  <td style={{ padding: '10px 10px', color: T.faint }}>{c.email}</td>
                  <td style={{ padding: '10px 10px', color: T.faint, fontFamily: 'monospace' }}>{c.phone}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(c.email)}
                      style={{
                        padding: '4px 12px', borderRadius: 6,
                        border: `1px solid ${T.border}`, background: 'transparent',
                        color: T.red, fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
