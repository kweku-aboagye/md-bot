export interface HghPlaylistSong {
  videoId: string;
  title: string;
  url: string;
}

export interface HghGapResult {
  totalPlaylistSongs: number;
  ministeredTitles: string[];
  unministeredSongs: HghPlaylistSong[];
  suggestedNext: HghPlaylistSong | null;
  ranAt: string;
}
