const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown"]);

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  const workerModule = await import(
    "pdfjs-dist/build/pdf.worker.min.mjs?url"
  );
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
  return pdfjs;
}

export async function extractPdfTextFromArrayBuffer(
  data: ArrayBuffer,
): Promise<string> {
  const { getDocument } = await loadPdfJs();
  const pdf = await getDocument({ data }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageLines = pageTextItemsToLines(content.items);
    if (pageLines.length > 0) {
      parts.push(pageLines.join("\n"));
    }
  }

  return parts.join("\n\n").trim();
}

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

/** Reconstruct lines from PDF text items using y/x position (pdf.js flattens to one line otherwise). */
function pageTextItemsToLines(items: unknown[]): string[] {
  const parsed: PdfTextItem[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const record = item as { str?: string; transform?: number[] };
    if (!record.str?.trim() || !Array.isArray(record.transform)) continue;
    parsed.push({
      str: record.str,
      x: record.transform[4] ?? 0,
      y: record.transform[5] ?? 0,
    });
  }

  if (parsed.length === 0) return [];

  parsed.sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 4) return yDiff;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let currentY: number | null = null;
  let currentParts: string[] = [];

  for (const item of parsed) {
    if (currentY === null || Math.abs(item.y - currentY) > 4) {
      if (currentParts.length > 0) {
        lines.push(currentParts.join(" ").replace(/\s+/g, " ").trim());
      }
      currentY = item.y;
      currentParts = [item.str];
    } else {
      currentParts.push(item.str);
    }
  }

  if (currentParts.length > 0) {
    lines.push(currentParts.join(" ").replace(/\s+/g, " ").trim());
  }

  return lines;
}

async function extractPdfText(file: File): Promise<string> {
  return extractPdfTextFromArrayBuffer(await file.arrayBuffer());
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

/**
 * Extract plain text from an uploaded document (PDF, DOCX, or plain text).
 */
export async function extractDocumentText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (TEXT_EXTENSIONS.has(ext)) {
    return (await file.text()).trim();
  }

  if (ext === "pdf") {
    return extractPdfText(file);
  }

  if (ext === "docx") {
    return extractDocxText(file);
  }

  if (ext === "doc") {
    throw new Error(
      "Legacy .doc files are not supported. Save as .docx or export as PDF.",
    );
  }

  throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.");
}

/** Fetch a public asset and extract its text (for built-in templates). */
export async function extractDocumentTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load template (${response.status})`);
  }

  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  const buffer = await response.arrayBuffer();

  if (TEXT_EXTENSIONS.has(ext)) {
    return new TextDecoder().decode(buffer).trim();
  }

  if (ext === "pdf") {
    return extractPdfTextFromArrayBuffer(buffer);
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value.trim();
  }

  throw new Error("Unsupported template URL. Use PDF, DOCX, or TXT.");
}
