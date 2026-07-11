import type { RfpDraft } from "@/types";

type ContentBlock = { type?: string; text?: string };

/** Unwrap LangChain content blocks (string, array, or serialized repr) to plain text. */
export function extractTextContent(content: unknown): string {
  if (content == null) return "";

  if (typeof content === "string") {
    const trimmed = content.trim();
    if (
      trimmed.startsWith("[") &&
      trimmed.includes("text") &&
      (trimmed.includes("'type'") || trimmed.includes('"type"'))
    ) {
      const inner = extractTextFromSerializedBlocks(trimmed);
      if (inner) return inner;
    }
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (block && typeof block === "object" && "text" in block) {
          return String((block as ContentBlock).text ?? "");
        }
        return "";
      })
      .join("");
  }

  if (typeof content === "object" && "text" in content) {
    return String((content as ContentBlock).text ?? "");
  }

  return String(content);
}

function extractTextFromSerializedBlocks(serialized: string): string | null {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (Array.isArray(parsed)) {
      const text = extractTextContent(parsed);
      if (text && text !== serialized) return text;
    }
  } catch {
    /* not JSON */
  }

  const patterns = [
    /['"]text['"]\s*:\s*'((?:\\.|[^'\\])*?)'/s,
    /['"]text['"]\s*:\s*"((?:\\.|[^"\\])*?)"/s,
  ];

  for (const pattern of patterns) {
    const match = serialized.match(pattern);
    if (match?.[1]) {
      return unescapeSerializedString(match[1]);
    }
  }

  return null;
}

function unescapeSerializedString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

/** Format structured draft JSON as a readable brief for the editor. */
export function draftToMarkdown(draft: Record<string, unknown> | undefined): string {
  if (!draft || Object.keys(draft).length === 0) return "";

  const lines: string[] = ["# Procurement brief (draft)", ""];
  const d = draft as RfpDraft;

  if (d.title) lines.push(`**Title:** ${d.title}`);
  if (d.organization) lines.push(`**Organization:** ${d.organization}`);
  if (d.category) lines.push(`**Category:** ${d.category}`);
  if (d.background) {
    lines.push("", "## Background", d.background);
  }

  const listSection = (heading: string, items?: string[]) => {
    if (!items?.length) return;
    lines.push("", `## ${heading}`);
    items.forEach((item) => lines.push(`- ${item}`));
  };

  listSection("Objectives", d.objectives);
  listSection("Scope of work", d.scope_of_work);
  listSection("Deliverables", d.deliverables);
  listSection("Functional requirements", d.functional_requirements);
  listSection("Technical requirements", d.technical_requirements);
  listSection("Compliance requirements", d.compliance_requirements);

  if (d.budget) {
    lines.push("", "## Budget");
    const b = d.budget;
    if (b.minimum != null || b.maximum != null) {
      lines.push(
        `- Range: ${b.minimum ?? "?"} – ${b.maximum ?? "?"} ${b.currency ?? ""}`.trim(),
      );
    }
    if (b.notes) lines.push(`- Notes: ${b.notes}`);
  }

  if (d.timeline) {
    lines.push("", "## Timeline");
    const t = d.timeline;
    if (t.proposal_due) lines.push(`- Proposal due: ${t.proposal_due}`);
    if (t.project_start) lines.push(`- Project start: ${t.project_start}`);
    if (t.project_end) lines.push(`- Project end: ${t.project_end}`);
  }

  listSection("Evaluation criteria", d.evaluation_criteria?.map((c) => c.criterion));

  return lines.join("\n").trim();
}

/** Detect structured-output JSON leaked into the message stream. */
export function isInternalAgentPayload(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    return (
      "draft" in parsed ||
      "has_clear_requirements" in parsed ||
      "ready_to_compose" in parsed ||
      "missing_critical" in parsed
    );
  } catch {
    return false;
  }
}

/** Full RFP documents belong in the editor panel, not the chat column. */
export function isFullRfpDocument(text: string): boolean {
  const trimmed = normalizeMarkdownContent(text);
  if (trimmed.length < 500) return false;
  return (
    trimmed.startsWith("# Request for Proposal") ||
    trimmed.startsWith("# RFP") ||
    trimmed.startsWith("# Cloud") ||
    (trimmed.startsWith("# ") && trimmed.includes("##"))
  );
}

/**
 * LLM / API sometimes returns markdown with literal `\n` instead of real newlines.
 * Preview and export need normalized text.
 */
export function normalizeMarkdownContent(raw: string): string {
  if (!raw) return "";

  let text = extractTextContent(raw).trim();

  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      text = JSON.parse(text) as string;
    } catch {
      /* keep original */
    }
  }

  if (text.includes("\\n") || text.includes("\\t")) {
    text = text
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "");
  }

  return text.trim();
}
