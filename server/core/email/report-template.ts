export interface ReportEmailContent {
  html: string;
  text: string;
}

export interface ReportEmailStat {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'info' | 'warning' | 'danger';
}

export interface ReportEmailAction {
  label: string;
  url: string;
}

export interface ReportEmailCallout {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReportEmailAction;
  tone?: 'info' | 'warning' | 'success';
}

export interface ReportEmailOptions {
  title: string;
  metaLine?: string;
  stats?: ReportEmailStat[];
  callout?: ReportEmailCallout;
  bodyHtml?: string;
  bodyText?: string;
  footerLabel?: string;
}

const CALL_OUT_TONES = {
  info: {
    accent: '#3b82f6',
    background: '#eff6ff',
  },
  warning: {
    accent: '#f59e0b',
    background: '#fff8e6',
  },
  success: {
    accent: '#16a34a',
    background: '#f0fdf4',
  },
} as const;

const STAT_TONES = {
  default: '#1a1a1a',
  success: '#16a34a',
  info: '#2563eb',
  warning: '#f59e0b',
  danger: '#ef4444',
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

export function buildReportEmail(options: ReportEmailOptions): ReportEmailContent {
  const footerLabel = options.footerLabel ?? 'MD Bot 🤖';

  const statsHtml =
    options.stats && options.stats.length > 0
      ? `
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        ${options.stats
          .map((stat) => {
            const tone = STAT_TONES[stat.tone ?? 'default'];
            return `
            <div style="flex: 1; background: #f8f8f8; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 28px; font-weight: 600; color: ${tone};">${escapeHtml(String(stat.value))}</div>
              <div style="color: #666; font-size: 13px;">${escapeHtml(stat.label)}</div>
            </div>
          `;
          })
          .join('')}
      </div>`
      : '';

  const calloutHtml = options.callout
    ? (() => {
        const tone = CALL_OUT_TONES[options.callout?.tone ?? 'info'];
        const eyebrowHtml = options.callout?.eyebrow
          ? `<div style="font-size: 11px; font-weight: 700; color: #666; margin-bottom: 4px; letter-spacing: 0.07em;">${escapeHtml(options.callout.eyebrow)}</div>`
          : '';
        const descriptionHtml = options.callout?.description
          ? `<p style="margin: 4px 0 0; color: #666; font-size: 14px;">${escapeHtml(options.callout.description)}</p>`
          : '';
        const actionHtml = options.callout?.action
          ? `<p style="margin: 10px 0 0;"><a href="${escapeHtml(options.callout.action.url)}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${escapeHtml(options.callout.action.label)} &rarr;</a></p>`
          : '';

        return `
      <div style="background: ${tone.background}; border-left: 3px solid ${tone.accent}; padding: 14px 18px; margin: 20px 0 24px; border-radius: 0 6px 6px 0;">
        ${eyebrowHtml}
        <p style="margin: 0; font-weight: 600; font-size: 15px;">${escapeHtml(options.callout.title)}</p>
        ${descriptionHtml}
        ${actionHtml}
      </div>`;
      })()
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin: 0 0 4px;">${escapeHtml(options.title)}</h2>
      ${options.metaLine ? `<p style="color: #666; font-size: 13px; margin: 0 0 24px;">${escapeHtml(options.metaLine)}</p>` : ''}

      ${statsHtml}
      ${calloutHtml}
      ${options.bodyHtml ?? ''}

      <p style="color: #666; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">&mdash; ${escapeHtml(footerLabel)}</p>
    </div>
  `;

  const statsText =
    options.stats && options.stats.length > 0
      ? options.stats.map((stat) => `${stat.label}: ${stat.value}`).join('\n')
      : '';

  const calloutText = options.callout
    ? joinTextSections([
        options.callout.eyebrow,
        options.callout.title,
        options.callout.description,
        options.callout.action
          ? `${options.callout.action.label}: ${options.callout.action.url}`
          : '',
      ])
    : '';

  const text = joinTextSections([
    options.title,
    options.metaLine,
    statsText,
    calloutText,
    options.bodyText,
    `- ${footerLabel}`,
  ]);

  return {
    html,
    text,
  };
}
