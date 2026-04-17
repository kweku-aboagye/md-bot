import '../dashboard.css';

const SECTIONS = [
  {
    title: '1. Purpose',
    body: 'MD Bot is an internal automation tool used exclusively by the music ministry team of ICGC Praise Temple. It sends automated scheduling reminders via email and SMS to team members who have explicitly consented to receive them.',
  },
  {
    title: '2. SMS Messaging',
    body: 'By providing your phone number to the system administrator, you consent to receive automated SMS reminders related to music ministry scheduling (e.g., setlist deadlines, song selections, rehearsal prep). Message frequency varies based on the ministry schedule — typically 2–10 messages per week. Message and data rates may apply.',
  },
  {
    title: '3. Opt-Out',
    body: 'To stop receiving SMS messages, contact the system administrator directly and request removal. Your number will be removed from the system promptly.',
  },
  {
    title: '4. Eligibility',
    body: 'This service is restricted to active members of the ICGC Praise Temple music ministry. Phone numbers are added manually by the administrator — this is not a public service.',
  },
  {
    title: '5. Changes',
    body: 'These terms may be updated at any time. Continued receipt of messages constitutes acceptance of any changes.',
  },
];

export function Terms() {
  return (
    <div className="legal-shell">
      <div className="legal-container">
        <h1 className="legal-title">Terms of Service</h1>
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
