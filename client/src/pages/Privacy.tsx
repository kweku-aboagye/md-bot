import { T } from '../theme';

export function Privacy() {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: T.bg, minHeight: '100vh', padding: '48px 16px',
      color: T.text,
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: T.text }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 32 }}>
          MD Bot — ICGC Praise Temple Music Director Dashboard
        </p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            1. Information We Collect
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            MD Bot collects the following information from ministry team members who have
            consented to receive automated reminders: name, email address, and phone number.
            This information is provided directly to the system administrator — there are no
            public sign-up forms.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            2. How We Use Your Information
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            Your contact information is used solely to send automated ministry scheduling
            reminders via email and SMS. We do not use it for marketing, advertising, or any
            purpose unrelated to the music ministry.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            3. Data Storage
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            Contact information is stored in a private, encrypted PostgreSQL database hosted
            on Railway. It is never stored in source code, version control, or any publicly
            accessible location.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            4. Data Sharing
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            We do not sell, share, or disclose your phone number or email address to any
            third party. SMS messages are delivered via Twilio solely as a transmission
            provider; your number is not used by Twilio for any other purpose.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            5. Data Retention & Removal
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            Your contact information is retained for as long as you are an active member of
            the music ministry team. To have your information removed, contact the system
            administrator and it will be deleted promptly.
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.faint, marginBottom: 10 }}>
            6. Contact
          </h2>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
            For any questions or removal requests, contact the ICGC Praise Temple music
            ministry administrator.
          </p>
        </section>

        <p style={{ fontSize: 12, color: T.muted, marginTop: 40 }}>
          Last updated: April 2026
        </p>
      </div>
    </div>
  );
}
