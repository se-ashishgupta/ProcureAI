import type { RfpTemplate } from "@/types";

const CUSTOM_TEMPLATES_KEY = "procure_custom_rfp_templates";

export interface BuiltInRfpTemplate {
  id: string;
  name: string;
  description: string;
  fileName: string;
  assetUrl: string;
  /** Fallback when PDF text extraction fails in-browser. */
  fallbackSections: string[];
}

export const BUILT_IN_RFP_TEMPLATES: BuiltInRfpTemplate[] = [
  {
    id: "nicsi-data-analytics",
    name: "NICSI — Data Analytics Platform",
    description:
      "Government RFP template (NICSI) for design, development, and implementation of a data analytics solution.",
    fileName: "RFP for Data Analytics Platform NICSI V1.2.pdf",
    assetUrl:
      "/assets/templates/RFP for Data Analytics Platform NICSI V1.2.pdf",
    fallbackSections: [
      "Factsheet",
      "Definitions",
      "Project Background",
      "Scope of Work (SoW)",
      "Proposed Solution",
      "Implementation Plan",
      "Project Deliverables and Acceptance Criteria",
      "Roles and Responsibility",
      "Bid Submission and Selection Criteria",
      "Annexures",
    ],
  },
];

export function loadCustomTemplates(): RfpTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RfpTemplate[];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: RfpTemplate): void {
  const existing = loadCustomTemplates().filter((t) => t.id !== template.id);
  localStorage.setItem(
    CUSTOM_TEMPLATES_KEY,
    JSON.stringify([template, ...existing]),
  );
}

export function deleteCustomTemplate(id: string): void {
  const next = loadCustomTemplates().filter((t) => t.id !== id);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next));
}

export function findBuiltInFallbackForFile(
  fileName: string,
): BuiltInRfpTemplate | undefined {
  const normalized = fileName.trim().toLowerCase();
  return BUILT_IN_RFP_TEMPLATES.find((template) => {
    const builtInName = template.fileName.toLowerCase();
    if (normalized === builtInName) return true;
    if (normalized.includes("nicsi") && builtInName.includes("nicsi")) return true;
    if (
      normalized.includes("data analytics") &&
      builtInName.includes("data analytics")
    ) {
      return true;
    }
    return false;
  });
}

export function builtInToRfpTemplate(
  builtIn: BuiltInRfpTemplate,
  sections: string[],
): RfpTemplate {
  return {
    id: builtIn.id,
    name: builtIn.name,
    fileName: builtIn.fileName,
    source: "builtin",
    sections,
    assetUrl: builtIn.assetUrl,
  };
}

export function uploadToRfpTemplate(
  fileName: string,
  sections: string[],
): RfpTemplate {
  return {
    id: crypto.randomUUID(),
    name: fileName.replace(/\.[^.]+$/, ""),
    fileName,
    source: "upload",
    sections,
  };
}
