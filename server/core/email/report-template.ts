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

export function buildReportEmail(options: ReportEmailOptions): ReportEmailContent {
  const footerLabel = options.footerLabel ?? 'MD Bot 🤖';

  const statsHtml =
    options.stats && options.stats.length > 0
      ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${options.stats
          .map((stat) => {
            const tone = STAT_TONES[stat.tone ?? 'default'];
            return `
            <tr>
              <td style="padding: 0 0 10px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px;">
                  <tr>
                    <td style="padding: 14px 16px; text-align: center;">
                      <div style="font-size: 28px; font-weight: 600; line-height: 1.2; color: ${tone}; word-break: break-word;">${escapeHtml(String(stat.value))}</div>
                      <div style="margin-top: 4px; color: #666666; font-size: 13px; line-height: 1.5; word-break: break-word;">${escapeHtml(stat.label)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `;
          })
          .join('')}
      </table>`
      : '';

  const calloutHtml = options.callout
    ? (() => {
        const tone = CALL_OUT_TONES[options.callout?.tone ?? 'info'];
        const eyebrowHtml = options.callout?.eyebrow
          ? `<div style="font-size: 11px; font-weight: 700; color: #666666; margin-bottom: 4px; letter-spacing: 0.07em; word-break: break-word;">${escapeHtml(options.callout.eyebrow)}</div>`
          : '';
        const descriptionHtml = options.callout?.description
          ? `<p style="margin: 6px 0 0; color: #666666; font-size: 14px; line-height: 1.5; word-break: break-word;">${escapeHtml(options.callout.description)}</p>`
          : '';
        const actionHtml = options.callout?.action
          ? `<p style="margin: 10px 0 0;"><a href="${escapeHtml(options.callout.action.url)}" style="color: #2563eb; text-decoration: none; font-weight: 600; word-break: break-word;">${escapeHtml(options.callout.action.label)} &rarr;</a></p>`
          : '';

        return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: separate; margin: 20px 0 24px; background: ${tone.background}; border-left: 3px solid ${tone.accent}; border-radius: 0 10px 10px 0;">
        <tr>
          <td style="padding: 16px;">
            ${eyebrowHtml}
            <p style="margin: 0; font-weight: 600; font-size: 15px; line-height: 1.5; word-break: break-word;">${escapeHtml(options.callout.title)}</p>
            ${descriptionHtml}
            ${actionHtml}
          </td>
        </tr>
      </table>`;
      })()
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
                  ${options.metaLine ? `<p style="margin: 0 0 20px; color: #666666; font-size: 13px; line-height: 1.5; word-break: break-word;">${escapeHtml(options.metaLine)}</p>` : ''}

                  ${statsHtml}
                  ${calloutHtml}
                  ${options.bodyHtml ?? ''}

                  <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 32px 0 0; border-top: 1px solid #eeeeee; padding-top: 16px;">&mdash; ${escapeHtml(footerLabel)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
