import type { CelestialCheckResult } from '../../modules/celestial/types';
import type { HghGapResult } from '../../modules/hgh-gap/types';
import type { ServiceResult } from '../../modules/pw/types';
import type { ZamarPrepResult } from '../../modules/zamar/types';

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

export interface MinistryStatus {
  targetSunday: string;
  ranAt: string;
  pw: {
    services: ServiceResult[];
    error?: string;
  };
  hgh: HghGapResult | null;
  celestial: CelestialCheckResult | null;
  zamar: ZamarPrepResult | null;
}
