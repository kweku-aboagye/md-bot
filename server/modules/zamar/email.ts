import type { ZamarPrepResult, ZamarSong } from './types';

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
    ? `<a href="${song.youtubeUrl}" style="color: #2563eb; text-decoration: none;">${song.title}</a>`
    : `<span>${song.title}</span>`;

  const sectionTag = song.section
    ? `<span style="font-size: 11px; color: #888; margin-left: 8px; background: #f0f0f0; padding: 2px 6px; border-radius: 10px;">${song.section}</span>`
    : '';

  return `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 10px 4px; color: #aaa; font-size: 13px; width: 28px;">${index + 1}</td>
      <td style="padding: 10px 8px; font-size: 14px;">${linkOrTitle}${sectionTag}</td>
      <td style="padding: 10px 4px; font-size: 12px; color: #888; white-space: nowrap;">${groupLabel(song.group)}</td>
    </tr>
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
        <h3 style="margin: 24px 0 8px; font-size: 14px; color: #888;">${label}</h3>
        <p style="color: #aaa; font-size: 13px; font-style: italic;">No songs submitted yet</p>
      `;
    }

    const rows = songs.map((song, index) => buildSongRow(song, startIndex + index)).join('');

    return `
      <h3 style="margin: 24px 0 8px; font-size: 14px; color: #555; text-transform: uppercase; letter-spacing: 0.05em;">${label}</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        ${rows}
      </table>
    `;
  }

  const noSongsWarning = totalSongs === 0
    ? `<div style="background: #fff3f3; border-left: 3px solid #ef4444; padding: 14px 18px; border-radius: 0 6px 6px 0; margin-bottom: 24px;">
        <p style="margin: 0; font-weight: 600;">No songs have been submitted yet for this Sunday.</p>
        <p style="margin: 4px 0 0; color: #666; font-size: 14px;">This prep list will be empty until the other teams update their sheets.</p>
      </div>`
    : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin: 0 0 4px;">Zamar Band: Wednesday Prep List</h2>
      <p style="color: #666; font-size: 13px; margin: 0 0 4px;">For Sunday ${formattedDate}</p>
      <p style="color: #666; font-size: 13px; margin: 0 0 24px;">Tonight's rehearsal — ${totalSongs} song${totalSongs !== 1 ? 's' : ''} to prepare</p>

      ${noSongsWarning}

      ${sectionBlock('Praise & Worship', pwSongs, 0)}
      ${sectionBlock('His Glory Heralds', hghSongs, pwSongs.length)}
      ${sectionBlock('Celestial Choir', celestialSongs, pwSongs.length + hghSongs.length)}

      <p style="margin-top: 24px; font-size: 14px; color: #666;">
        Songs with links: click to open the YouTube reference. Songs without links may still be added — check back if anything looks missing.
      </p>

      <p style="color: #666; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">— MD Bot 🤖</p>
    </div>
  `;
}
