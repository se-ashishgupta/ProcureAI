import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { normalizeMarkdownContent } from "./rfp-content";

type LineStyle = {
  fontSize: number;
  fontStyle: "normal" | "bold";
  indent: number;
  marginTop: number;
};

function parseMarkdownLine(line: string): { style: LineStyle; text: string } {
  const trimmed = line.trim();

  if (!trimmed) {
    return {
      style: { fontSize: 11, fontStyle: "normal", indent: 0, marginTop: 6 },
      text: "",
    };
  }

  if (trimmed.startsWith("# ")) {
    return {
      style: { fontSize: 22, fontStyle: "bold", indent: 0, marginTop: 4 },
      text: trimmed.slice(2),
    };
  }

  if (trimmed.startsWith("## ")) {
    return {
      style: { fontSize: 16, fontStyle: "bold", indent: 0, marginTop: 14 },
      text: trimmed.slice(3),
    };
  }

  if (trimmed.startsWith("### ")) {
    return {
      style: { fontSize: 13, fontStyle: "bold", indent: 0, marginTop: 10 },
      text: trimmed.slice(4),
    };
  }

  if (/^[-*]\s+/.test(trimmed)) {
    return {
      style: { fontSize: 11, fontStyle: "normal", indent: 16, marginTop: 3 },
      text: `• ${trimmed.replace(/^[-*]\s+/, "")}`,
    };
  }

  return {
    style: { fontSize: 11, fontStyle: "normal", indent: 0, marginTop: 4 },
    text: trimmed,
  };
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function inlineRuns(text: string): TextRun[] {
  const plain = stripInlineMarkdown(text);
  if (!plain.includes("**")) {
    return [new TextRun({ text: plain })];
  }

  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*.+?\*\*)/g).filter(Boolean);

  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else {
      runs.push(new TextRun({ text: stripInlineMarkdown(part) }));
    }
  }

  return runs.length ? runs : [new TextRun({ text: plain })];
}

function markdownToDocxParagraphs(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const rawLine of markdown.split("\n")) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
      continue;
    }

    if (trimmed.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: inlineRuns(trimmed.slice(2)),
        }),
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: inlineRuns(trimmed.slice(3)),
        }),
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: inlineRuns(trimmed.slice(4)),
        }),
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: 0 },
          children: inlineRuns(trimmed.replace(/^[-*]\s+/, "")),
        }),
      );
      continue;
    }

    paragraphs.push(new Paragraph({ children: inlineRuns(trimmed) }));
  }

  return paragraphs;
}

export async function exportMarkdownAsDocx(
  markdown: string,
  filename = "rfp.docx",
) {
  const content = normalizeMarkdownContent(markdown);
  const doc = new Document({
    sections: [{ children: markdownToDocxParagraphs(content) }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export function exportMarkdownAsPdf(
  markdown: string,
  filename = "rfp.pdf",
) {
  const content = normalizeMarkdownContent(markdown);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  for (const rawLine of content.split("\n")) {
    const { style, text } = parseMarkdownLine(rawLine);

    if (!text) {
      y += style.marginTop;
      continue;
    }

    const plain = stripInlineMarkdown(text);
    pdf.setFontSize(style.fontSize);
    pdf.setFont("helvetica", style.fontStyle);

    const wrapped = pdf.splitTextToSize(plain, maxWidth - style.indent);
    const lineHeight = style.fontSize * 1.4;

    y += style.marginTop;
    for (const wline of wrapped) {
      ensureSpace(lineHeight);
      pdf.text(wline, margin + style.indent, y);
      y += lineHeight;
    }
  }

  pdf.save(filename);
}
