export interface ZamarSong {
  title: string;
  youtubeUrl: string | null;
  group: 'P&W' | 'HGH' | 'Celestial';
  section?: string;
  /** ISO date of the service this song belongs to. */
  serviceDate?: string;
}

export interface ZamarPrepResult {
  targetSunday: string;
  songs: ZamarSong[];
  emailSent: boolean;
  ranAt: string;
}
