export interface ScheduleInfo {
  adminEmail: string | null;
  nextRunAt: string;
  targetSunday: string;
  upcomingHalfNight: string | null;
  emailRouting: {
    pwIncomplete: string;
    pwMissingLeader: string[];
    celestial: string[];
    hghSelection: string[];
    hghGap: string[];
    zamar: string[];
  };
}
