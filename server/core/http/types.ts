export interface ScheduleInfo {
  adminEmail: string | null;
  nextRunAt: string;
  targetSunday: string;
  emailRouting: {
    pwIncomplete: string;
    pwMissingLeader: string[];
    celestial: string[];
    hghSelection: string[];
    hghGap: string[];
    zamar: string[];
  };
}
