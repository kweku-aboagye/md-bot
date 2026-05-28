export const DOCUMENT_ID = '1SD2t9J7jYZUnN9QDOr2TWgtfkEkOfe4yuxYYb1_WwLY';
function parseEmailList(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim() || null;
}

function withAdminEmail(emails: string[]) {
  const admin = getAdminEmail();
  return admin ? Array.from(new Set([...emails, admin])) : [...emails];
}

export function getCelestialChoirEmails() {
  return withAdminEmail(parseEmailList(process.env.CELESTIAL_CHOIR_EMAILS));
}

export function getZamarBandEmails() {
  return withAdminEmail(parseEmailList(process.env.ZAMAR_BAND_EMAILS));
}

export function getPraiseAndWorshipEmails() {
  return withAdminEmail(parseEmailList(process.env.PRAISE_AND_WORSHIP_EMAILS));
}

export function getHisGloryHeraldsEmails() {
  return withAdminEmail(parseEmailList(process.env.HIS_GLORY_HERALDS_EMAILS));
}

export function getEmailRoutingConfig() {
  const adminEmail = getAdminEmail();
  return {
    pwIncomplete: 'Section leader',
    pwMissingLeader: getPraiseAndWorshipEmails(),
    celestial: getCelestialChoirEmails(),
    hghSelection: getHisGloryHeraldsEmails(),
    hghGap: adminEmail ? [adminEmail] : [],
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
