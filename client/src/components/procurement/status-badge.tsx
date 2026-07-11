import type { ProcurementStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<ProcurementStatus, string> = {
  draft: "Draft",
  brief_submitted: "Brief submitted",
  brief_approved: "Brief approved",
  rfp_published: "RFP published",
  evaluation_ready: "Evaluation ready",
  award_decided: "Award decided",
};

const STATUS_VARIANT: Record<
  ProcurementStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  brief_submitted: "outline",
  brief_approved: "default",
  rfp_published: "default",
  evaluation_ready: "outline",
  award_decided: "default",
};

export function ProcurementStatusBadge({ status }: { status: ProcurementStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
