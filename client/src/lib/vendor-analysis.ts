import {
  DEMO_VENDOR_TEMPLATES,
  type DemoVendorTemplate,
} from "@/lib/mock-vendor-proposals";
import type { ComplianceRow, VendorProposalAnalysis } from "@/types";

const PARSE_DELAY_MS = 2800;

export function getParseDelayMs(): number {
  return PARSE_DELAY_MS;
}

/** Parse the fixed budget cap from RFP markdown (supports ranges like $0 - $200,000). */
export function extractBudgetCapUsd(markdown: string): number | null {
  const text = markdown.replace(/\u00a0/g, " ");
  if (!text.trim()) return null;

  const rangeMatch = text.match(/\$\s*[\d,]+\s*-\s*\$\s*([\d,]+)/i);
  if (rangeMatch) {
    return Number.parseInt(rangeMatch[1].replace(/,/g, ""), 10);
  }

  const capPhrases = [
    /fixed-price cap[^$\n]{0,40}\$\s*([\d,]+)/i,
    /budget cap[^$\n]{0,40}\$\s*([\d,]+)/i,
    /maximum[^$\n]{0,40}\$\s*([\d,]+)/i,
    /budget[^$\n]{0,60}\$\s*([\d,]+)\s*(?:USD|usd)?/i,
  ];

  for (const pattern of capPhrases) {
    const match = text.match(pattern);
    if (match) {
      const value = Number.parseInt(match[1].replace(/,/g, ""), 10);
      if (Number.isFinite(value) && value > 0) return value;
    }
  }

  return null;
}

function isBudgetComplianceRow(row: ComplianceRow): boolean {
  return /budget|price cap|cost cap|fixed-price cap/i.test(row.requirement);
}

function recalcOverallScore(analysis: VendorProposalAnalysis): number {
  const score =
    analysis.technicalScore * 0.4 +
    analysis.commercialScore * 0.3 +
    analysis.legalScore * 0.3;
  return Math.round(score * 10) / 10;
}

/**
 * Re-evaluate budget compliance rows using the current published RFP markdown.
 * Fixes stale $150k labels when the RFP budget was edited after vendor load.
 */
export function applyRfpBudgetToAnalysis(
  analysis: VendorProposalAnalysis,
  rfpMarkdown?: string,
): VendorProposalAnalysis {
  const cap = extractBudgetCapUsd(rfpMarkdown ?? "");
  if (!cap) return analysis;

  let commercialScore = analysis.commercialScore;
  let budgetStatusChanged = false;

  const compliance = analysis.compliance.map((row) => {
    if (!isBudgetComplianceRow(row)) return row;

    const met = analysis.totalCost <= cap;
    const wasMet = row.status === "met";
    if (wasMet !== met) budgetStatusChanged = true;

    if (met && !wasMet) {
      commercialScore = Math.min(10, commercialScore + 1.2);
    } else if (!met && wasMet) {
      commercialScore = Math.max(0, commercialScore - 1.2);
    }

    return {
      ...row,
      requirement: `Budget cap $${cap.toLocaleString()} USD`,
      status: met ? ("met" as const) : ("not_met" as const),
      quote: met
        ? `$${analysis.totalCost.toLocaleString()} USD — within cap of $${cap.toLocaleString()}.`
        : `$${analysis.totalCost.toLocaleString()} USD — exceeds cap of $${cap.toLocaleString()}.`,
    };
  });

  const next: VendorProposalAnalysis = {
    ...analysis,
    compliance,
    commercialScore: Math.round(commercialScore * 10) / 10,
  };

  if (budgetStatusChanged) {
    next.overallScore = recalcOverallScore(next);
  }

  return next;
}

export function findDemoTemplate(vendorName: string): DemoVendorTemplate | undefined {
  const normalized = vendorName.trim().toLowerCase();
  return DEMO_VENDOR_TEMPLATES.find(
    (t) => t.vendorName.toLowerCase() === normalized,
  );
}

/** Demo parser: match known vendors or synthesize scores from file metadata. */
export function buildDemoAnalysis(
  vendorName: string,
  fileName: string,
): VendorProposalAnalysis {
  const template = findDemoTemplate(vendorName);
  if (template) {
    return { ...template.analysis };
  }

  const hash = fileName.length + vendorName.length;
  const base = 6.5 + (hash % 25) / 10;

  return {
    totalCost: 130000 + (hash % 30) * 1000,
    currency: "USD",
    timelineMonths: 4 + (hash % 3),
    teamSize: 5 + (hash % 6),
    technicalScore: Math.min(10, base + 0.5),
    commercialScore: Math.min(10, base),
    legalScore: Math.min(10, base - 0.3),
    overallScore: Math.min(10, base + 0.2),
    compliance: [
      {
        requirement: "Meets RFP scope",
        status: "met",
        quote: `Proposal from ${vendorName} addresses core migration scope.`,
      },
      {
        requirement: "Budget alignment",
        status: hash % 2 === 0 ? "met" : "unclear",
        quote: "Commercial section requires manual review for year-2 costs.",
      },
      {
        requirement: "Timeline feasibility",
        status: "met",
        quote: "Proposed schedule aligns with RFP proposal due date.",
      },
    ],
    highlights: [`Uploaded file: ${fileName}`, "AI extraction completed (demo mode)"],
    risks: ["Demo analysis — upload a named demo vendor for richer data"],
    summary: `${vendorName} proposal parsed successfully. Review compliance rows and scores below.`,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
