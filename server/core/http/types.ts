// One Sunday and the three dates that matter to it. The music deadline is the
// band's Wednesday rehearsal; the team rehearses the following Sunday; the
// service is the Sunday after that.
export interface PrepCycle {
  /** ISO date of the service. */
  sunday: string;
  /** ISO datetime of the Wednesday 12 PM CT band rehearsal. */
  deadline: string;
  /** ISO date of the Sunday the team rehearses this set. */
  teamRehearsal: string;
}

export interface ScheduleInfo {
  adminEmail: string | null;
  nextRunAt: string;
  targetSunday: string;
  /**
   * The Sunday leaders are currently being reminded about, or null between the
   * Wednesday noon deadline and the Thursday the next window opens.
   */
  collecting: PrepCycle | null;
  /** Whole CT days until the collecting deadline; null when nothing is open. */
  daysUntilDeadline: number | null;
  /** The Sunday already with the band — set, rehearsing, not being chased. */
  locked: PrepCycle;
  emailRouting: {
    pwIncomplete: string;
    pwMissingLeader: string[];
    pwMissingService: string[];
    celestial: string[];
    hghSelection: string[];
    hghGap: string[];
    zamar: string[];
  };
}
