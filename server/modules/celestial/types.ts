export interface CelestialHymnRecord {
  date: string;
  songLink: string | null;
  event: string | null;
}

export interface CelestialCheckResult {
  targetSunday: string;
  event: string | null;
  hymnSelected: boolean;
  songLink: string | null;
  emailSent: boolean;
  ranAt: string;
}

export interface CelestialServiceStatus {
  date: string;
  event: string | null;
  hymnSelected: boolean;
  songLink: string | null;
}

export interface CelestialWeekStatus {
  targetSunday: string;
  services: CelestialServiceStatus[];
  /** True only when every service in the week has a hymn selected. */
  hymnSelected: boolean;
}
