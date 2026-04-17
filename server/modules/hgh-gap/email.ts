import { buildReportEmail } from '../../core/email/report-template';
import type { HghGapResult } from './types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildHghGapReportEmail(result: HghGapResult) {
  const { unministeredSongs, suggestedNext, totalPlaylistSongs, ministeredTitles } = result;
  const ministeredCount = ministeredTitles.length;
  const remainingCount = unministeredSongs.length;
  const songListRows = unministeredSongs
    .slice(0, 20)
    .map(
      (song, index) =>
        `<div style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <div style="font-size: 12px; color: #9ca3af; margin-bottom: 6px;">${index + 1}</div>
          <a href="${escapeHtml(song.url)}" style="color: #2563eb; text-decoration: none; font-size: 15px; line-height: 1.55; word-break: break-word;">
            ${escapeHtml(song.title)}
          </a>
        </div>`
    )
    .join('');

  const truncationNote =
    unministeredSongs.length > 20
      ? `<p style="color: #666; font-size: 13px;">+ ${unministeredSongs.length - 20} more songs not shown. See full list on the dashboard.</p>`
      : '';

  const bodyHtml = remainingCount > 0
    ? `
        <h3 style="margin: 24px 0 12px; font-size: 15px; line-height: 1.4;">All unministered songs</h3>
        <div>
          ${songListRows}
        </div>
        ${truncationNote}
      `
    : '<p style="margin: 0; color: #666; line-height: 1.6;">All playlist songs have been ministered. Time to refresh the playlist.</p>';

  const bodyText = remainingCount > 0
    ? [
        `All unministered songs (${remainingCount}):`,
        ...unministeredSongs
          .slice(0, 20)
          .map((song, index) => `${index + 1}. ${song.title}\n   ${song.url}`),
        unministeredSongs.length > 20
          ? `+ ${unministeredSongs.length - 20} more songs not shown. See full list on the dashboard.`
          : '',
      ].filter(Boolean).join('\n')
    : 'All playlist songs have been ministered. Time to refresh the playlist.';

  return buildReportEmail({
    title: 'HGH Weekly Gap Report',
    metaLine: `Generated ${new Date(result.ranAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
    stats: [
      { label: 'Total in playlist', value: totalPlaylistSongs },
      { label: 'Ministered', value: ministeredCount, tone: 'success' },
      { label: 'Remaining', value: remainingCount, tone: 'info' },
    ],
    callout: suggestedNext
      ? {
          eyebrow: 'SUGGESTED NEXT',
          title: suggestedNext.title,
          action: {
            label: 'Open song',
            url: suggestedNext.url,
          },
          tone: 'info',
        }
      : {
          title: 'All playlist songs have been ministered.',
          description: 'Time to refresh the playlist.',
          tone: 'success',
        },
    bodyHtml,
    bodyText,
  });
}
