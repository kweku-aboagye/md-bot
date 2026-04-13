import { DOCUMENT_ID } from '../../core/config/resources';
import { createRunId } from '../../core/email/history';
import { log } from '../../core/logging/log';
import { formatISODate, getTargetSunday } from '../../core/scheduling/target-sunday';
import { getAllSundays, getServicesForWeek } from './document-reader';
import { validateSections, sendValidationEmails } from './validator';
import { SECTION_NAMES } from './types';
import type { SectionData, ServiceResult, ValidationResult, WeekData } from './types';

function withPaddedSections(weekData: WeekData): WeekData {
  const sections: SectionData[] = SECTION_NAMES.map((name) => {
    const existing = weekData.sections.find((section) => section.name === name);
    return existing || { name, leaderEmail: null, songs: [] };
  });

  return {
    ...weekData,
    sections,
  };
}

export async function getPwStatus(targetSunday = getTargetSunday()) {
  const weekServices = await getServicesForWeek(DOCUMENT_ID, targetSunday);

  return {
    targetSunday: formatISODate(targetSunday),
    services: weekServices.map(withPaddedSections),
  };
}

export async function getPwValidationSnapshot(targetSunday = getTargetSunday()): Promise<ServiceResult[]> {
  const weekServices = await getServicesForWeek(DOCUMENT_ID, targetSunday);

  return weekServices.map((service) => ({
    serviceDate: service.serviceDate,
    rawHeader: service.rawHeader,
    sections: validateSections(service),
    emailsSent: [],
  }));
}

export async function listPwSundays() {
  return getAllSundays(DOCUMENT_ID);
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

      if (complete === total && trigger === 'scheduled') {
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
