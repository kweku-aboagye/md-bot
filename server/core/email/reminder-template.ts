import { daysUntilDeadline, getMusicDeadline, getTargetSunday } from '../scheduling/target-sunday';

export interface ReminderEmailAction {
  label: string;
  url: string;
}

export interface ReminderEmailContent {
  html: string;
  text: string;
}

export interface ReminderEmailOptions {
  title: string;
  metaLine?: string;
  tone?: 'warning' | 'critical' | 'info';
  highlightTitle: string;
  highlightLines?: string[];
  paragraphs: string[];
  bullets?: string[];
  action?: ReminderEmailAction;
  footerLabel?: string;
}

const TONES = {
  warning: {
    accent: '#f59e0b',
    background: '#fff8e6',
  },
  critical: {
    accent: '#ef4444',
    background: '#fff1f2',
  },
  info: {
    accent: '#3b82f6',
    background: '#eff6ff',
  },
} as const;

const EMAIL_FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function joinTextSections(sections: Array<string | null | undefined>): string {
  return sections.filter((section) => section && section.trim().length > 0).join('\n\n').trim();
}

export function formatEmailDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatEmailTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ── Music deadline copy ───────────────────────────────────────────────────────
// Everything a reminder says about the deadline is derived here so the three
// modules can't drift: one countdown, one tone ladder, one way of writing the
// date. The service date deliberately does not appear — it is 11 days past the
// date that actually matters, and naming it made the deadline look further away
// than it is.

export interface DeadlineContext {
  /** Whole CT days until the band rehearses. 0 on the day, negative once past. */
  daysLeft: number;
  /** "6 days left" · "1 day left" · "Last call" */
  countdown: string;
  /** "Wed 9 Sep" — for subject lines. */
  dueShort: string;
  /** "Wednesday 9 September at 12 PM" — for body copy. */
  dueLong: string;
  /** Trailing half of a subject line: "due Wed 9 Sep" · "due today, 12 PM". */
  subjectTail: string;
  tone: 'info' | 'warning' | 'critical';
}

export function buildDeadlineContext(
  targetSunday: Date = getTargetSunday(),
  from: Date = new Date()
): DeadlineContext {
  const daysLeft = daysUntilDeadline(from, targetSunday);
  const deadline = getMusicDeadline(targetSunday);

  return {
    daysLeft,
    countdown:
      daysLeft <= 0 ? 'Last call' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`,
    dueShort: formatDeadlineShort(deadline),
    dueLong: `${formatDeadlineLong(deadline)} at 12 PM`,
    subjectTail: daysLeft <= 0 ? 'due today, 12 PM' : `due ${formatDeadlineShort(deadline)}`,
    tone: daysLeft <= 0 ? 'critical' : daysLeft <= 2 ? 'warning' : 'info',
  };
}

// The band rehearsal is the only thing a leader has to act before, so every
// reminder explains the deadline in the same sentence.
export function deadlineSentence(deadline: DeadlineContext): string {
  return deadline.daysLeft <= 0
    ? 'The band rehearses at 12 PM today. Anything added after that will not be in their list.'
    : `Songs are due ${deadline.dueLong}, when the band rehearses.`;
}

function formatDeadlineShort(deadline: Date): string {
  return deadline.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDeadlineLong(deadline: Date): string {
  return deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function buildReminderEmail(options: ReminderEmailOptions): ReminderEmailContent {
  const tone = TONES[options.tone ?? 'warning'];
  const footerLabel = options.footerLabel ?? 'MD Bot 🤖';

  const metaHtml = options.metaLine
    ? `<p style="margin: 0 0 20px; color: #666666; font-size: 13px; line-height: 1.5; word-break: break-word;">${escapeHtml(options.metaLine)}</p>`
    : '';

  const highlightLinesHtml = (options.highlightLines ?? [])
    .map(
      (line) =>
        `<p style="margin: 6px 0 0; color: #666666; font-size: 14px; line-height: 1.5; word-break: break-word;">${escapeHtml(line)}</p>`
    )
    .join('');

  const paragraphsHtml = options.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px; color: #1a1a1a; font-size: 15px; line-height: 1.6; word-break: break-word;">${escapeHtml(paragraph)}</p>`
    )
    .join('');

  const bulletsHtml =
    options.bullets && options.bullets.length > 0
      ? `
      <ul style="margin: 0 0 20px 20px; padding: 0; color: #1a1a1a;">
        ${options.bullets
          .map(
            (bullet) =>
              `<li style="margin: 0 0 8px; font-size: 15px; line-height: 1.5; word-break: break-word;">${escapeHtml(bullet)}</li>`
          )
          .join('')}
      </ul>`
      : '';

  const actionHtml = options.action
    ? `
      <p style="margin: 0 0 16px;">
        <a href="${escapeHtml(options.action.url)}" style="color: #2563eb; text-decoration: none; font-weight: 600; word-break: break-word;">
          ${escapeHtml(options.action.label)} &rarr;
        </a>
      </p>`
    : '';

  const html = `
    <div style="margin: 0; padding: 0; background: #f5f7fb;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background: #f5f7fb;">
        <tr>
          <td align="center" style="padding: 24px 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 620px; border-collapse: collapse; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px;">
              <tr>
                <td style="padding: 24px 20px; font-family: ${EMAIL_FONT_STACK}; color: #1a1a1a;">
                  <h2 style="margin: 0 0 4px; font-size: 24px; line-height: 1.25; word-break: break-word;">${escapeHtml(options.title)}</h2>
                  ${metaHtml}

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: separate; margin: 0 0 24px; background: ${tone.background}; border-left: 3px solid ${tone.accent}; border-radius: 0 10px 10px 0;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0; font-size: 16px; font-weight: 600; line-height: 1.5; word-break: break-word;">${escapeHtml(options.highlightTitle)}</p>
                        ${highlightLinesHtml}
                      </td>
                    </tr>
                  </table>

                  ${paragraphsHtml}
                  ${bulletsHtml}
                  ${actionHtml}

                  <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 32px 0 0; border-top: 1px solid #eeeeee; padding-top: 16px;">&mdash; ${escapeHtml(footerLabel)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const bulletsText =
    options.bullets && options.bullets.length > 0
      ? ['Items:', ...options.bullets.map((bullet) => `- ${bullet}`)].join('\n')
      : '';

  const text = joinTextSections([
    options.title,
    options.metaLine,
    [options.highlightTitle, ...(options.highlightLines ?? [])].join('\n'),
    options.paragraphs.join('\n\n'),
    bulletsText,
    options.action ? `${options.action.label}: ${options.action.url}` : '',
    `- ${footerLabel}`,
  ]);

  return {
    html,
    text,
  };
}
