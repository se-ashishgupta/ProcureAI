import { Client } from "@langchain/langgraph-sdk";
import type {
  ComplianceRow,
  VendorProposalAnalysis,
} from "@/types";

const LANGGRAPH_API_URL =
  import.meta.env.VITE_LANGGRAPH_API_URL ?? "http://localhost:2024";

const PROPOSAL_ANALYSIS_ASSISTANT_ID =
  import.meta.env.VITE_PROPOSAL_ANALYSIS_ASSISTANT_ID ??
  "proposal_analysis_agent";

export function createLangGraphClient(): Client {
  return new Client({ apiUrl: LANGGRAPH_API_URL });
}

function normalizeCompliance(raw: unknown): ComplianceRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    const status = String(r.status ?? "unclear").replace("-", "_");
    const normalized =
      status === "met" || status === "not_met" || status === "unclear"
        ? status
        : "unclear";
    return {
      requirement: String(r.requirement ?? ""),
      status: normalized as ComplianceRow["status"],
      quote: r.quote ? String(r.quote) : undefined,
    };
  });
}

/** Normalize LangGraph / LLM output (camelCase or snake_case) to client shape. */
export function normalizeProposalAnalysis(
  raw: Record<string, unknown>,
): VendorProposalAnalysis {
  return {
    totalCost: Number(raw.totalCost ?? raw.total_cost ?? 0),
    currency: String(raw.currency ?? "USD"),
    timelineMonths: Number(raw.timelineMonths ?? raw.timeline_months ?? 0),
    teamSize: Number(raw.teamSize ?? raw.team_size ?? 0),
    technicalScore: Number(raw.technicalScore ?? raw.technical_score ?? 0),
    commercialScore: Number(raw.commercialScore ?? raw.commercial_score ?? 0),
    legalScore: Number(raw.legalScore ?? raw.legal_score ?? 0),
    overallScore: Number(raw.overallScore ?? raw.overall_score ?? 0),
    compliance: normalizeCompliance(raw.compliance),
    highlights: Array.isArray(raw.highlights)
      ? raw.highlights.map(String)
      : [],
    risks: Array.isArray(raw.risks) ? raw.risks.map(String) : [],
    summary: String(raw.summary ?? ""),
  };
}

export async function runProposalAnalysis(input: {
  vendorName: string;
  fileName: string;
  rfpMarkdown?: string;
  proposalText?: string;
}): Promise<VendorProposalAnalysis> {
  const client = createLangGraphClient();
  const thread = await client.threads.create();

  // runs.wait() returns thread values directly (not { values: ... }).
  const values = (await client.runs.wait(
    thread.thread_id,
    PROPOSAL_ANALYSIS_ASSISTANT_ID,
    {
      input: {
        vendor_name: input.vendorName,
        file_name: input.fileName,
        rfp_markdown: input.rfpMarkdown ?? "",
        proposal_text: input.proposalText ?? "",
      },
    },
  )) as Record<string, unknown> | null | undefined;

  const rawAnalysis = values?.analysis as Record<string, unknown> | undefined;
  if (!rawAnalysis || typeof rawAnalysis !== "object") {
    throw new Error("Analysis agent returned no structured result.");
  }

  return normalizeProposalAnalysis(rawAnalysis);
}
