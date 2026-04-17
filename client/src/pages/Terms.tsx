import { T } from '../theme';

export function Terms() {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: T.bg, minHeight: '100vh', padding: '48px 16px',
      color: T.text,
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: T.text }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 32 }}>
          MD Bot — ICGC Praise Temple Music Director Dashboard
        </p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            1. Purpose
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            MD Bot is an internal automation tool used exclusively by the music ministry team of
            ICGC Praise Temple. It sends automated scheduling reminders via email and SMS to
            team members who have explicitly consented to receive them.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            2. SMS Messaging
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            By providing your phone number to the system administrator, you consent to receive
            automated SMS reminders related to music ministry scheduling (e.g., setlist
            deadlines, song selections, rehearsal prep). Message frequency varies based on the
            ministry schedule — typically 2–10 messages per week. Message and data rates may
            apply.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            3. Opt-Out
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            To stop receiving SMS messages, contact the system administrator directly and
            request removal. Your number will be removed from the system promptly.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            4. Eligibility
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            This service is restricted to active members of the ICGC Praise Temple music
            ministry. Phone numbers are added manually by the administrator — this is not a
            public service.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            5. Changes
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            These terms may be updated at any time. Continued receipt of messages constitutes
            acceptance of any changes.
          </p>
        </section>

        <p style={{ fontSize: 12, color: T.muted, marginTop: 40 }}>
          Last updated: April 2026
        </p>
      </div>
    </div>
  );
}
