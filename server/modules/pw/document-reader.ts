import type { SectionName, SectionData, WeekData } from './types';
import { SECTION_NAMES } from './types';
import { getDocsClient } from '../../core/google/auth';

// ── YouTube / email helpers ───────────────────────────────────────────────────

function isYoutubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function extractYoutubeUrl(text: string): string | null {
  const match = text.match(/(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+/i);
  return match ? match[0] : null;
}

function isEmailAddress(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}

// ── Date parsing ──────────────────────────────────────────────────────────────

function parseDateFromHeader(header: string): Date | null {
  const cleaned = header.replace(/\s+/g, ' ').trim();

  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];

  const monthPattern = monthNames.join('|');
  const dateRegex = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:[,\\s]+(\\d{4}))?`,
    'i'
  );
  const match = cleaned.match(dateRegex);

  if (match) {
    const monthIndex = monthNames.indexOf(match[1].toLowerCase());
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
    const date = new Date(year, monthIndex, day);
    if (!isNaN(date.getTime())) return date;
  }

  const slashMatch = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

function looksLikeDateHeader(text: string): boolean {
  return parseDateFromHeader(text) !== null;
}

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ── Section name matching ─────────────────────────────────────────────────────

function matchesSectionName(text: string): SectionName | null {
  const lower = text.toLowerCase().trim();

  if (/^call\s+to\s+worship\s*[:\-]?\s*$/i.test(lower) || lower === 'call to worship') {
    return 'Call to Worship';
  }
  if (/^worship\s*[:\-]?\s*$/i.test(lower) || lower === 'worship') {
    return 'Worship';
  }
  if (/^(?:worship\s+(?:and|&)\s+)?praise\s*[:\-]?\s*$/i.test(lower) || lower === 'praise') {
    return 'Praise';
  }
  for (const name of SECTION_NAMES) {
    if (lower === name.toLowerCase()) return name;
  }
  return null;
}

// ── Paragraph extraction ──────────────────────────────────────────────────────

interface ParagraphInfo {
  text: string;
  style: string;
  youtubeUrl: string | null;
  personEmail: string | null;
}

function extractParagraphs(content: any[]): ParagraphInfo[] {
  const paragraphs: ParagraphInfo[] = [];

  for (const element of content) {
    if (!element.paragraph) continue;

    const para = element.paragraph;
    const style = para.paragraphStyle?.namedStyleType || '';

    let fullText = '';
    let linkUrl: string | null = null;
    let personEmail: string | null = null;

    for (const el of para.elements || []) {
      if (el.textRun) {
        const text = el.textRun.content || '';
        fullText += text;
        const link = el.textRun.textStyle?.link?.url;
        if (link && isYoutubeUrl(link)) linkUrl = link;
      }

      if (el.person?.personProperties) {
        const props = el.person.personProperties;
        personEmail = props.email || null;
        fullText += props.name || props.email || '';
      }

      if (el.richLink?.richLinkProperties) {
        const rlProps = el.richLink.richLinkProperties;
        const uri = rlProps.uri || '';
        if (isYoutubeUrl(uri)) {
          linkUrl = uri;
          fullText += rlProps.title || uri;
        } else {
          fullText += rlProps.title || uri;
        }
      }
    }

    fullText = fullText.trim();
    if (!fullText) continue;

    const inlineUrl = extractYoutubeUrl(fullText);
    paragraphs.push({
      text: fullText,
      style,
      youtubeUrl: linkUrl || inlineUrl,
      personEmail,
    });
  }

  return paragraphs;
}

// ── Section parsing ───────────────────────────────────────────────────────────

function parseSectionsFromParagraphs(paragraphs: ParagraphInfo[]): SectionData[] {
  const sections: SectionData[] = [];
  let currentSection: SectionData | null = null;
  let foundLeaderForCurrentSection = false;

  for (const p of paragraphs) {
    const sectionName = matchesSectionName(p.text);
    const isExactSectionName =
      sectionName && SECTION_NAMES.some((n) => p.text.trim().toLowerCase() === n.toLowerCase());

    if (sectionName && (isExactSectionName || !p.youtubeUrl)) {
      if (currentSection) sections.push(currentSection);
      currentSection = { name: sectionName, leaderEmail: null, songs: [] };
      foundLeaderForCurrentSection = false;
      continue;
    }

    if (!currentSection) continue;

    if (!foundLeaderForCurrentSection && (p.personEmail || isEmailAddress(p.text))) {
      currentSection.leaderEmail = p.personEmail || p.text.trim();
      foundLeaderForCurrentSection = true;
      continue;
    }

    const cleanedTitle = p.text
      .replace(/(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/playlist\?)[^\s]*/gi, '')
      .replace(/[-–—•*·]\s*/, '')
      .trim();

    if (cleanedTitle.length >= 2 && !isEmailAddress(cleanedTitle)) {
      currentSection.songs.push({
        title: cleanedTitle,
        youtubeUrl: p.youtubeUrl,
      });
    }
  }

  if (currentSection) sections.push(currentSection);
  return sections;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getServicesForWeek(
  documentId: string,
  targetSunday: Date
): Promise<WeekData[]> {
  const docs = await getDocsClient();
  const doc = await docs.documents.get({ documentId });
  const content = doc.data.body?.content || [];
  const paragraphs = extractParagraphs(content);

  const sundayDate = new Date(Date.UTC(
    targetSunday.getUTCFullYear(),
    targetSunday.getUTCMonth(),
    targetSunday.getUTCDate()
  ));
  const mondayDate = new Date(sundayDate);
  mondayDate.setUTCDate(sundayDate.getUTCDate() - 6);

  const datedHeaders: Array<{ index: number; date: Date; text: string }> = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const isHeading = p.style.includes('HEADING') || looksLikeDateHeader(p.text);
    if (!isHeading) continue;
    const headerDate = parseDateFromHeader(p.text);
    if (headerDate) {
      const d = new Date(Date.UTC(
        headerDate.getFullYear(),
        headerDate.getMonth(),
        headerDate.getDate()
      ));
      datedHeaders.push({ index: i, date: d, text: p.text });
    }
  }

  const inRangeHeaders = datedHeaders.filter(
    (h) => h.date >= mondayDate && h.date <= sundayDate
  );

  if (inRangeHeaders.length === 0) return [];

  const results: WeekData[] = [];

  for (const header of inRangeHeaders) {
    const contentStart = header.index + 1;
    let contentEnd = paragraphs.length;
    for (const dh of datedHeaders) {
      if (dh.index > header.index) {
        contentEnd = dh.index;
        break;
      }
    }

    const sectionParagraphs = paragraphs.slice(contentStart, contentEnd);
    const sections = parseSectionsFromParagraphs(sectionParagraphs);

    results.push({
      serviceDate: formatDateString(header.date),
      rawHeader: header.text,
      sections,
    });
  }

  results.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  return results;
}
