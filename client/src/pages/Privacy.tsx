import '../dashboard.css';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'MD Bot collects name, email address, and phone number from ministry team members who have consented to receive automated reminders. This information is provided directly to the system administrator — there are no public sign-up forms.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your contact information is used solely to send automated ministry scheduling reminders via email and SMS. We do not use it for marketing, advertising, or any purpose unrelated to the music ministry.',
  },
  {
    title: '3. Data Storage',
    body: 'Contact information is stored in a private, encrypted PostgreSQL database hosted on Railway. It is never stored in source code, version control, or any publicly accessible location.',
  },
  {
    title: '4. Data Sharing',
    body: 'We do not sell, share, or disclose your phone number or email address to any third party. SMS messages are delivered via Twilio solely as a transmission provider; your number is not used by Twilio for any other purpose.',
  },
  {
    title: '5. Data Retention & Removal',
    body: 'Your contact information is retained for as long as you are an active member of the music ministry team. To have your information removed, contact the system administrator and it will be deleted promptly.',
  },
  {
    title: '6. Contact',
    body: 'For any questions or removal requests, contact the ICGC Praise Temple music ministry administrator.',
  },
];

export function Privacy() {
  return (
    <div className="legal-shell">
      <div className="legal-container">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-subtitle">MD Bot — ICGC Praise Temple Music Director Dashboard</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="legal-section">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <p className="legal-footer">Last updated: April 2026</p>
      </div>
    </div>
  );
}
