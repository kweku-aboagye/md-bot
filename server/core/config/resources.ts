export const DOCUMENT_ID = '1SD2t9J7jYZUnN9QDOr2TWgtfkEkOfe4yuxYYb1_WwLY';
function parseEmailList(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function withAdminEmails(emails: string[]) {
  return Array.from(new Set([...emails, ...getAdminEmails()]));
}

export function getAdminEmails() {
  return parseEmailList(process.env.ADMIN_EMAIL);
}

export function getCelestialChoirEmails() {
  return withAdminEmails(parseEmailList(process.env.CELESTIAL_CHOIR_EMAILS));
}

export function getZamarBandEmails() {
  return withAdminEmails(parseEmailList(process.env.ZAMAR_BAND_EMAILS));
}

export function getPraiseAndWorshipEmails() {
  return withAdminEmails(parseEmailList(process.env.PRAISE_AND_WORSHIP_EMAILS));
}

export function getHisGloryHeraldsEmails() {
  return withAdminEmails(parseEmailList(process.env.HIS_GLORY_HERALDS_EMAILS));
}

export function getEmailRoutingConfig() {
  return {
    pwIncomplete: 'Section leader',
    pwMissingLeader: getPraiseAndWorshipEmails(),
    celestial: getCelestialChoirEmails(),
    hghSelection: getHisGloryHeraldsEmails(),
    hghGap: getAdminEmails(),
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
