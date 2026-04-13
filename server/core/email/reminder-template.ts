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

export function buildReminderEmail(options: ReminderEmailOptions): ReminderEmailContent {
  const tone = TONES[options.tone ?? 'warning'];
  const footerLabel = options.footerLabel ?? 'MD Bot 🤖';

  const metaHtml = options.metaLine
    ? `<p style="color: #666; font-size: 13px; margin: 0 0 24px;">${escapeHtml(options.metaLine)}</p>`
    : '';

  const highlightLinesHtml = (options.highlightLines ?? [])
    .map(
      (line) =>
        `<p style="margin: 4px 0 0; color: #666; font-size: 14px;">${escapeHtml(line)}</p>`
    )
    .join('');

  const paragraphsHtml = options.paragraphs
    .map((paragraph) => `<p style="margin: 0 0 16px; line-height: 1.6;">${escapeHtml(paragraph)}</p>`)
    .join('');

  const bulletsHtml =
    options.bullets && options.bullets.length > 0
      ? `
      <ul style="margin: 0 0 20px 20px; padding: 0; color: #1a1a1a;">
        ${options.bullets
          .map((bullet) => `<li style="margin: 0 0 8px; line-height: 1.5;">${escapeHtml(bullet)}</li>`)
          .join('')}
      </ul>`
      : '';

  const actionHtml = options.action
    ? `
      <p style="margin: 0 0 16px;">
        <a href="${escapeHtml(options.action.url)}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
          ${escapeHtml(options.action.label)} &rarr;
        </a>
      </p>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin: 0 0 4px;">${escapeHtml(options.title)}</h2>
      ${metaHtml}

      <div style="background: ${tone.background}; border-left: 3px solid ${tone.accent}; padding: 14px 18px; border-radius: 0 6px 6px 0; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 600;">${escapeHtml(options.highlightTitle)}</p>
        ${highlightLinesHtml}
      </div>

      ${paragraphsHtml}
      ${bulletsHtml}
      ${actionHtml}

      <p style="color: #666; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">&mdash; ${escapeHtml(footerLabel)}</p>
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
