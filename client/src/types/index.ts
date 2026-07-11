export type UserRole = "admin" | "procurement_manager" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

export interface OrgSettings {
  id: string;
  name: string;
  industry: string;
  website?: string;
  policySummary: string;
  /** Short label shown as avatar when no logo image */
  logoLabel?: string;
}

export type ProcurementStatus =
  | "draft"
  | "brief_submitted"
  | "brief_approved"
  | "rfp_published"
  | "evaluation_ready"
  | "award_decided";

export type VendorProposalStatus =
  | "uploaded"
  | "parsing"
  | "parsing_complete"
  | "error";

export type ComplianceStatus = "met" | "not_met" | "unclear";

export interface ComplianceRow {
  requirement: string;
  status: ComplianceStatus;
  quote?: string;
}

export interface VendorProposalAnalysis {
  totalCost: number;
  currency: string;
  timelineMonths: number;
  teamSize: number;
  technicalScore: number;
  commercialScore: number;
  legalScore: number;
  overallScore: number;
  compliance: ComplianceRow[];
  highlights: string[];
  risks: string[];
  summary: string;
}

export interface VendorProposal {
  id: string;
  vendorName: string;
  fileName: string;
  fileSize?: number;
  /** Extracted document text sent to LangGraph (not stored for demo-only loads). */
  proposalText?: string;
  status: VendorProposalStatus;
  uploadedAt: string;
  analysis?: VendorProposalAnalysis;
  chatThreadId?: string;
}

export interface ProcurementCreator {
  userId: string;
  name: string;
  email: string;
  role?: UserRole;
}

export interface RfpTemplate {
  id: string;
  name: string;
  fileName: string;
  source: "builtin" | "upload" | "saved";
  sections: string[];
  assetUrl?: string;
}

export interface ProcurementEvent {
  id: string;
  title: string;
  status: ProcurementStatus;
  requirement?: string;
  briefMarkdown?: string;
  rfpMarkdown?: string;
  rfpTemplate?: RfpTemplate;
  threadId?: string;
  vendorProposals?: VendorProposal[];
  awardedVendorId?: string;
  createdBy?: ProcurementCreator;
  createdAt: string;
  updatedAt: string;
}

export interface RfpDraft {
  title?: string;
  organization?: string;
  category?: string;
  background?: string;
  objectives?: string[];
  scope_of_work?: string[];
  deliverables?: string[];
  functional_requirements?: string[];
  technical_requirements?: string[];
  compliance_requirements?: string[];
  budget?: {
    minimum?: number;
    maximum?: number;
    currency?: string;
    notes?: string;
  };
  timeline?: {
    proposal_due?: string;
    project_start?: string;
    project_end?: string;
  };
  evaluation_criteria?: Array<{ criterion: string }>;
}

export interface RfpGraphState {
  messages?: Array<{ type?: string; content?: string; id?: string }>;
  draft?: Record<string, unknown>;
  rfp_markdown?: string;
  rfp_confirmed?: boolean;
  missing_critical?: string[];
  need_summary?: string;
  interaction_stage?: string;
  ready_to_compose?: boolean;
  has_clear_requirements?: boolean;
  template_sections?: string[];
  template_file_name?: string;
}

export interface ProposalChatState {
  messages?: Array<{ type?: string; content?: string; id?: string }>;
  vendor_name?: string;
  file_name?: string;
  rfp_markdown?: string;
  analysis?: VendorProposalAnalysis;
}

export interface RfpInterruptPayload {
  type?: string;
  stage?: string;
  assistant_message?: string;
  rfp_markdown?: string;
  missing_critical?: string[];
  need_summary?: string;
  actions?: string[];
}
