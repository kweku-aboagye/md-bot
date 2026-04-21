import type { ZamarPrepResult, ZamarSong } from './types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatSunday(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function groupLabel(group: ZamarSong['group']): string {
  switch (group) {
    case 'P&W':
      return 'Praise & Worship';
    case 'HGH':
      return 'His Glory Heralds';
    case 'Celestial':
      return 'Celestial Choir';
  }
}

function buildSongRow(song: ZamarSong, index: number): string {
  const linkOrTitle = song.youtubeUrl
    ? `<a href="${escapeHtml(song.youtubeUrl)}" style="color: #2563eb; text-decoration: none; word-break: break-word;">${escapeHtml(song.title)}</a>`
    : `<span style="word-break: break-word;">${escapeHtml(song.title)}</span>`;

  const sectionTag = song.section
    ? `<span style="display: inline-block; margin-top: 8px; font-size: 11px; color: #666666; background: #f3f4f6; padding: 3px 8px; border-radius: 999px;">${escapeHtml(song.section)}</span>`
    : '';

  return `
    <div style="padding: 14px 0; border-bottom: 1px solid #f0f0f0;">
      <div style="font-size: 12px; color: #9ca3af; margin-bottom: 6px;">${index + 1}</div>
      <div style="font-size: 15px; line-height: 1.55; color: #1a1a1a; word-break: break-word;">${linkOrTitle}</div>
      ${sectionTag}
      <div style="margin-top: 8px; font-size: 12px; color: #666666; line-height: 1.5;">${escapeHtml(groupLabel(song.group))}</div>
    </div>
  `;
}

export function buildZamarPrepEmail(result: ZamarPrepResult): string {
  const formattedDate = formatSunday(result.targetSunday);
  const totalSongs = result.songs.length;

  const pwSongs = result.songs.filter((song) => song.group === 'P&W');
  const hghSongs = result.songs.filter((song) => song.group === 'HGH');
  const celestialSongs = result.songs.filter((song) => song.group === 'Celestial');

  function sectionBlock(label: string, songs: ZamarSong[], startIndex: number): string {
    if (songs.length === 0) {
      return `
        <h3 style="margin: 24px 0 8px; font-size: 14px; color: #888888;">${escapeHtml(label)}</h3>
        <p style="margin: 0; color: #9ca3af; font-size: 13px; font-style: italic; line-height: 1.5;">No songs submitted yet</p>
      `;
    }

    const rows = songs.map((song, index) => buildSongRow(song, startIndex + index)).join('');

    return `
      <h3 style="margin: 24px 0 8px; font-size: 14px; color: #555555; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(label)}</h3>
      <div style="margin-bottom: 8px;">
        ${rows}
      </div>
    `;
  }

  const noSongsWarning = totalSongs === 0
    ? `<div style="background: #fff3f3; border-left: 3px solid #ef4444; padding: 14px 18px; border-radius: 0 6px 6px 0; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 600;">No songs have been submitted yet for this service.</p>
        <p style="margin: 4px 0 0; color: #666; font-size: 14px;">This prep list will be empty until the other teams update their sheets.</p>
      </div>`
    : '';

  return `
    <div style="margin: 0; padding: 0; background: #f5f7fb;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background: #f5f7fb;">
        <tr>
          <td align="center" style="padding: 24px 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 620px; border-collapse: collapse; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px;">
              <tr>
                <td style="padding: 24px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a;">
                  <h2 style="margin: 0 0 4px; font-size: 24px; line-height: 1.25; word-break: break-word;">Zamar Band: Wednesday Prep List</h2>
                  <p style="margin: 0 0 4px; color: #666666; font-size: 13px; line-height: 1.5; word-break: break-word;">For ${escapeHtml(formattedDate)}</p>
                  <p style="margin: 0 0 24px; color: #666666; font-size: 13px; line-height: 1.5; word-break: break-word;">Tonight's rehearsal — ${totalSongs} song${totalSongs !== 1 ? 's' : ''} to prepare</p>

                  ${noSongsWarning}

                  ${sectionBlock('Praise & Worship', pwSongs, 0)}
                  ${sectionBlock('His Glory Heralds', hghSongs, pwSongs.length)}
                  ${sectionBlock('Celestial Choir', celestialSongs, pwSongs.length + hghSongs.length)}

                  <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #666666; word-break: break-word;">
                    Songs with links: click to open the YouTube reference. Songs without links may still be added — check back if anything looks missing.
                  </p>

                  <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 32px 0 0; border-top: 1px solid #eeeeee; padding-top: 16px;">— MD Bot 🤖</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}
