import { google } from 'googleapis';
import { HGH_ARCHIVES_TAB, HGH_DATA_START_ROW, HGH_SHEET_ID, HGH_SHEET_TAB, HGH_YOUTUBE_PLAYLIST_ID } from '../../core/config/resources';
import { readColumnLinks } from '../../core/google/sheets';
import { log } from '../../core/logging/log';
import type { HghGapResult, HghPlaylistSong } from './types';

// ── YouTube playlist reader ───────────────────────────────────────────────────

async function getYouTubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY environment variable not set');
  return google.youtube({ version: 'v3', auth: apiKey });
}

export async function fetchPlaylistSongs(
  playlistId: string
): Promise<HghPlaylistSong[]> {
  const yt = await getYouTubeClient();
  const songs: HghPlaylistSong[] = [];
  let pageToken: string | undefined;

  do {
    const response = await yt.playlistItems.list({
      part: ['snippet'],
      playlistId,
      maxResults: 50,
      ...(pageToken ? { pageToken } : {}),
    });

    const items = response.data.items || [];

    for (const item of items) {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (videoId && title && title !== 'Deleted video' && title !== 'Private video') {
        songs.push({
          videoId,
          title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return songs;
}

// ── Video-ID-based sheet reader ───────────────────────────────────────────────
//
// Reads column A from both Current and Archives tabs using the full cell
// metadata API so we can extract video IDs from BOTH link types:
//   - Inserted hyperlinks  → video ID is in cell.hyperlink
//   - YouTube chips        → video ID is in cell.userEnteredValue (the raw URL)
//
// Returns a Set<string> of YouTube video IDs representing every song that has
// ever been ministered and has a YouTube recording linked in the sheet.

export async function fetchMinisteredVideoIds(): Promise<Set<string>> {
  const [currentLinks, archivesLinks] = await Promise.all([
    readColumnLinks(HGH_SHEET_ID, HGH_SHEET_TAB, 'A', HGH_DATA_START_ROW + 1),
    readColumnLinks(HGH_SHEET_ID, HGH_ARCHIVES_TAB, 'A', 2),
  ]);

  const videoIds = new Set<string>();

  for (const link of [...currentLinks, ...archivesLinks]) {
    if (link.youtubeVideoId) {
      videoIds.add(link.youtubeVideoId);
    }
  }

  log(
    `fetchMinisteredVideoIds: ${currentLinks.length} meaningful Current rows + ${archivesLinks.length} meaningful Archives rows → ${videoIds.size} unique video IDs`,
    'hgh-gap'
  );

  return videoIds;
}

// ── Main gap finder ───────────────────────────────────────────────────────────
// Uses the same video-ID-based matching as hghGapTracker.ts (the email report)
// so the dashboard count always matches the emailed report.

export async function runHghGapFinder(): Promise<HghGapResult> {
  log('Starting HGH gap finder (video ID matching)', 'hgh-gap');

  const [playlistSongs, ministeredIds] = await Promise.all([
    fetchPlaylistSongs(HGH_YOUTUBE_PLAYLIST_ID),
    fetchMinisteredVideoIds(),
  ]);

  const unministeredSongs = playlistSongs.filter(v => !ministeredIds.has(v.videoId));
  const ministeredSongs   = playlistSongs.filter(v =>  ministeredIds.has(v.videoId));
  const ministeredTitles  = ministeredSongs.map(v => v.title);
  const suggestedNext     = unministeredSongs.length > 0 ? unministeredSongs[0] : null;

  log(
    `HGH gap finder: ${playlistSongs.length} in playlist, ${ministeredIds.size} linked IDs, ${unministeredSongs.length} never ministered`,
    'hgh-gap'
  );

  return {
    totalPlaylistSongs: playlistSongs.length,
    ministeredTitles,
    unministeredSongs,
    suggestedNext,
    ranAt: new Date().toISOString(),
  };
}
