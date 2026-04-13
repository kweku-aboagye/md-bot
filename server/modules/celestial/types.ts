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
