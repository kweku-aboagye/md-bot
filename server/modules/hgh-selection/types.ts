export interface HghSelectionStatus {
  songSelected: boolean;
  targetSunday: string;
}

export interface HghServiceStatus {
  date: string;
  songSelected: boolean;
}

export interface HghSelectionWeekStatus {
  targetSunday: string;
  services: HghServiceStatus[];
  /** True only when every service in the week has a song selected. */
  songSelected: boolean;
}
