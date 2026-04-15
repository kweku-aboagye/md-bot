export const DOCUMENT_ID = '1SD2t9J7jYZUnN9QDOr2TWgtfkEkOfe4yuxYYb1_WwLY';
export const DEFAULT_ADMIN_EMAIL = 'hello@kwekuaboagye.me';
const DEFAULT_CELESTIAL_NOTIFICATION_EMAILS = ['KelvinSam223@gmail.com'] as const;
const DEFAULT_ZAMAR_BAND_EMAILS = [
  DEFAULT_CELESTIAL_NOTIFICATION_EMAILS[0],
  'imlawklufio@gmail.com',
  'Tntaamah26@gmail.com',
] as const;

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
}

function parseEmailList(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function getEnvEmailList(name: string, fallback: readonly string[]) {
  const configured = parseEmailList(process.env[name]);
  return configured.length > 0 ? configured : [...fallback];
}

function withAdminEmail(emails: readonly string[]) {
  return Array.from(new Set([...emails, getAdminEmail()]));
}

export function getCelestialNotificationEmails() {
  return withAdminEmail(
    getEnvEmailList('CELESTIAL_NOTIFICATION_EMAILS', DEFAULT_CELESTIAL_NOTIFICATION_EMAILS)
  );
}

export function getZamarBandEmails() {
  return withAdminEmail(getEnvEmailList('ZAMAR_BAND_EMAILS', DEFAULT_ZAMAR_BAND_EMAILS));
}

export function getEmailRoutingConfig() {
  const adminEmail = getAdminEmail();

  return {
    pwIncomplete: 'Section leader',
    pwMissingLeader: adminEmail,
    celestial: getCelestialNotificationEmails(),
    hghSelection: [adminEmail],
    hghGap: [adminEmail],
    zamar: getZamarBandEmails(),
  };
}

export const HGH_SHEET_ID = '1ywm_L1vvndS-_P25hh3Sxl0C6mtun6HDlRpvmfbnVvE';
export const CELESTIAL_SHEET_ID = '1ZfPTMRu8Z8CbOAjk553jq-O5vtywZ5_8jlU6GNQuaDA';
export const HGH_YOUTUBE_PLAYLIST_ID = 'PLoFyCfy6CTrdrzLP1bQJrtBcD6BINBZBZ';

export const HGH_SHEET_TAB = 'Current';
export const HGH_ARCHIVES_TAB = 'Archives';
export const CELESTIAL_SHEET_TAB = 'Current';

export const HGH_COL_TITLE = 0;
export const HGH_COL_DATE = 1;

export const CELESTIAL_COL_DATE = 0;
export const CELESTIAL_COL_SONG = 1;
export const CELESTIAL_COL_EVENT = 2;

export const HGH_DATA_START_ROW = 2;
