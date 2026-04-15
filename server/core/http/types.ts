export interface ScheduleInfo {
  adminEmail: string;
  nextRunAt: string;
  targetSunday: string;
  emailRouting: {
    pwIncomplete: string;
    pwMissingLeader: string;
    celestial: string[];
    hghSelection: string[];
    hghGap: string[];
    zamar: string[];
  };
}
