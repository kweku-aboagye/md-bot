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
  /**
   * Whether the Wednesday band rehearsal has happened when this list was built.
   * Always true for the scheduled noon run; false for a manual /api/test/zamar-prep
   * fired earlier in the window, where the list is a preview rather than final.
   */
  deadlinePassed: boolean;
  songs: ZamarSong[];
  emailSent: boolean;
  ranAt: string;
}
