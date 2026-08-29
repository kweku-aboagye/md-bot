import { DOCUMENT_ID } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { log } from '../../core/logging/log';
import {
  formatCtDate,
  formatISODate,
  getHalfNightCadenceDate,
  getTargetSunday,
} from '../../core/scheduling/target-sunday';
import { getServiceHeaders, getServicesForWeek } from './document-reader';
import { validateSections, sendValidationEmails } from './validator';
import type { ServiceHeader, ValidationResult } from './types';

// ── Half Night confirmation ───────────────────────────────────────────────────

const HALF_NIGHT_PATTERN = /half\s*[-–—]?\s*night/i;

// The dashboard asks on every load, and the answer only changes when a leader
// edits the document, so a short cache keeps this off the Docs API hot path.
const HEADER_CACHE_MS = 5 * 60 * 1000;
let headerCache: { at: number; headers: ServiceHeader[] } | null = null;

async function readServiceHeaders(): Promise<ServiceHeader[]> {
  if (headerCache && Date.now() - headerCache.at < HEADER_CACHE_MS) {
    return headerCache.headers;
  }

  const headers = await getServiceHeaders(DOCUMENT_ID);
  headerCache = { at: Date.now(), headers };
  return headers;
}

/**
 * The date of a Half Night in the prep window, but only when the P&W document
 * actually has an entry for it. The first-Friday cadence on its own is not
 * proof: most months the document has no Friday service at all, and announcing
 * one the leaders never scheduled is worse than staying quiet.
 *
 * A document entry counts as proof when it is either named a Half Night in its
 * own header (so a Half Night moved off the first Friday still shows), or falls
 * on the first Friday the cadence points at. Returns null when neither holds.
 */
export async function getConfirmedHalfNight(
  from: Date = new Date(),
  targetSunday: Date = getTargetSunday()
): Promise<string | null> {
  const fromISO = formatCtDate(from);
  const targetISO = formatCtDate(targetSunday);

  const inWindow = (await readServiceHeaders()).filter(
    (h) => h.serviceDate >= fromISO && h.serviceDate <= targetISO
  );

  const named = inWindow.find((h) => HALF_NIGHT_PATTERN.test(h.rawHeader));
  if (named) return named.serviceDate;

  const cadenceDate = getHalfNightCadenceDate(from, targetSunday);
  const onCadence = cadenceDate && inWindow.some((h) => h.serviceDate === cadenceDate);

  return onCadence ? cadenceDate : null;
}

export async function getPwStatus(targetSunday = getTargetSunday()) {
  const weekServices = await getServicesForWeek(DOCUMENT_ID, targetSunday);

  return {
    targetSunday: formatISODate(targetSunday),
    services: weekServices,
  };
}

export async function runValidation(
  trigger: 'scheduled' | 'manual' = 'manual'
): Promise<ValidationResult> {
  const targetSunday = getTargetSunday();
  const targetDateStr = formatISODate(targetSunday);
  const runId = createRunId();

  log(`Starting P&W validation for week of Sunday ${targetDateStr} (trigger: ${trigger})`, 'pw');

  const result: ValidationResult = {
    id: runId,
    targetSunday: targetDateStr,
    ranAt: new Date().toISOString(),
    trigger,
    services: [],
    emailsSent: [],
  };

  try {
    const weekServices = await getServicesForWeek(DOCUMENT_ID, targetSunday);

    if (weekServices.length === 0) {
      result.error = `No service sections found in the document for the week of Sunday ${targetDateStr}`;
      log(result.error, 'pw');
      return result;
    }

    const allEmailsSent: ValidationResult['emailsSent'] = [];

    for (const weekData of weekServices) {
      const sections = validateSections(weekData);
      const complete = sections.filter((section) => section.status === 'complete').length;
      const total = sections.length;

      let serviceEmails: ValidationResult['emailsSent'] = [];

      if (complete === total && total > 0 && trigger === 'scheduled') {
        log(`All ${total} sections complete for ${weekData.serviceDate} - skipping emails`, 'pw');
      } else {
        serviceEmails = await sendValidationEmails(sections, weekData, {
          runId,
          trigger,
          targetSunday: result.targetSunday,
        });
        allEmailsSent.push(...serviceEmails);
      }

      result.services.push({
        serviceDate: weekData.serviceDate,
        rawHeader: weekData.rawHeader,
        sections,
        emailsSent: serviceEmails,
      });

      log(`Validated ${weekData.serviceDate}: ${complete}/${total} sections ready`, 'pw');
    }

    result.emailsSent = allEmailsSent;
  } catch (err: any) {
    result.error = err.message || 'Unknown error during P&W validation';
    log(`P&W validation failed: ${result.error}`, 'pw');
  }

  return result;
}
