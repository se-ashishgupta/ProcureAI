/** Normalize a detected section title for display and prompting. */
function cleanSectionTitle(raw: string): string {
  return raw
    .replace(/\.{2,}.*$/, "")
    .replace(/\s+\d+\s*$/, "")
    .replace(/\t+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isTopLevelNumber(line: string): boolean {
  return /^\d+\s+[A-Za-z]/.test(line) && !/^\d+\.\d+/.test(line);
}

function isValidSectionTitle(title: string): boolean {
  if (title.length < 3 || title.length > 120) return false;
  if (/^page$/i.test(title)) return false;
  if (/^\d+\.\d+/.test(title)) return false;
  if (/^p\s*a\s*g\s*e$/i.test(title)) return false;
  return true;
}

function addSection(sections: string[], title: string): void {
  const cleaned = cleanSectionTitle(title);
  if (!isValidSectionTitle(cleaned)) return;
  if (!sections.includes(cleaned)) sections.push(cleaned);
}

/** Parse TOC entries from flattened PDF text (often one long line per page). */
function parseInlineTocEntries(text: string): string[] {
  const contentsIdx = text.search(/\bContents\b/i);
  const sliceStart = contentsIdx >= 0 ? contentsIdx : 0;
  const slice = text.slice(sliceStart, sliceStart + 16000);
  const disclaimerIdx = slice.search(/\bDisclaimer\b/i);
  const region = disclaimerIdx > 0 ? slice.slice(0, disclaimerIdx) : slice;

  const sections: string[] = [];

  // "1 Factsheet..... 5" or "1 Factsheet     5"
  const tocPattern =
    /\b(\d{1,2})\s+([A-Za-z][A-Za-z0-9\s\-&(),/'""]+?)(?:\.{2,}|\s{2,})\s*\d{1,4}\b/g;

  for (const match of region.matchAll(tocPattern)) {
    addSection(sections, match[2]);
  }

  return sections;
}

/** Parse the table-of-contents block when line breaks are preserved. */
function parseContentsBlock(text: string): string[] {
  const contentsIdx = text.search(/\bContents\b/i);
  if (contentsIdx === -1) return [];

  const slice = text.slice(contentsIdx, contentsIdx + 12000);
  const lines = slice.split(/\r?\n/);
  const sections: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^Contents$/i.test(trimmed)) continue;
    if (/^Disclaimer$/i.test(trimmed)) break;
    if (/^-- \d+ of \d+ --/.test(trimmed)) continue;
    if (/^\d+\s*\|\s*P\s*a\s*g\s*e/i.test(trimmed)) continue;

    const tocMatch = trimmed.match(/^(\d{1,2})\s+(.+)$/);
    if (!tocMatch) continue;
    // Skip subsections like "3.1 About" (no space between major number and title only)
    if (/^\d+\.\d+/.test(trimmed)) continue;

    addSection(sections, tocMatch[2]);
  }

  return sections;
}

/** Scan body text for top-level numbered section headings. */
function parseNumberedHeadings(text: string): string[] {
  const sections: string[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!isTopLevelNumber(trimmed)) continue;
    if (/^\d+\s*\|\s*P\s*a\s*g\s*e/i.test(trimmed)) continue;

    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (!match) continue;

    addSection(sections, match[2]);
  }

  return sections;
}

/** Find numbered headings in flattened PDF body text. */
function parseInlineNumberedHeadings(text: string): string[] {
  const sections: string[] = [];
  const pattern =
    /\b(\d{1,2})\s+([A-Z][A-Za-z0-9\s\-&(),/]+?)(?=\s+\d{1,2}\s+[A-Z]|\s+\d+\.\d+\s|\bDisclaimer\b|\d+\s*\|\s*P\s*a\s*g\s*e|$)/g;

  for (const match of text.matchAll(pattern)) {
    if (parseInt(match[1], 10) > 30) continue;
    addSection(sections, match[2]);
  }

  return sections;
}

/** Detect markdown-style headings in extracted text. */
function parseMarkdownHeadings(text: string): string[] {
  const sections: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^#{1,3}\s+(.+)$/);
    if (!match) continue;
    addSection(sections, match[1]);
  }
  return sections;
}

function pickBestSectionList(candidates: string[][]): string[] {
  const valid = candidates.filter((c) => c.length >= 3);
  if (valid.length === 0) return [];

  // Prefer top-level TOC-sized lists (typical RFP: 5–20 sections)
  const ideal = valid.filter((c) => c.length >= 3 && c.length <= 20);
  if (ideal.length > 0) {
    ideal.sort((a, b) => a.length - b.length);
    return ideal[0];
  }

  valid.sort((a, b) => a.length - b.length);
  return valid[0];
}

/**
 * Detect major section headings from an RFP template document.
 * Handles both line-based text (DOCX) and flattened PDF extraction.
 */
export function detectTemplateSections(text: string): string[] {
  const normalized = text.replace(/\u00a0/g, " ").trim();
  if (!normalized) return [];

  const candidates = [
    parseContentsBlock(normalized),
    parseInlineTocEntries(normalized),
    parseNumberedHeadings(normalized),
    parseInlineNumberedHeadings(normalized),
    parseMarkdownHeadings(normalized),
  ];

  const best = pickBestSectionList(candidates.filter((c) => c.length >= 3));
  if (best.length >= 3) return best;

  const partial = pickBestSectionList(candidates);
  return partial;
}
