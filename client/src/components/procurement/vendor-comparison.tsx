import type { VendorProposal, VendorProposalAnalysis } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2, FileText, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 7) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function cellBg(score: number): string {
  if (score >= 8) return "bg-emerald-500/15";
  if (score >= 7) return "bg-amber-500/15";
  return "bg-red-500/15";
}

interface VendorComparisonMatrixProps {
  proposals: VendorProposal[];
}

export function VendorComparisonMatrix({ proposals }: VendorComparisonMatrixProps) {
  const parsed = proposals.filter(
    (p) => p.status === "parsing_complete" && p.analysis,
  );
  const [detail, setDetail] = useState<{
    vendor: string;
    label: string;
    value: string;
    quote?: string;
  } | null>(null);

  if (parsed.length === 0) return null;

  const rows: Array<{
    key: string;
    label: string;
    getValue: (a: VendorProposalAnalysis) => string;
    getScore?: (a: VendorProposalAnalysis) => number;
    quoteKey?: keyof VendorProposalAnalysis;
  }> = [
    {
      key: "cost",
      label: "Total cost",
      getValue: (a) =>
        `${a.totalCost.toLocaleString()} ${a.currency}`,
    },
    {
      key: "timeline",
      label: "Timeline",
      getValue: (a) => `${a.timelineMonths} months`,
    },
    {
      key: "technical",
      label: "Technical (AI)",
      getValue: (a) => a.technicalScore.toFixed(1),
      getScore: (a) => a.technicalScore,
    },
    {
      key: "commercial",
      label: "Commercial (AI)",
      getValue: (a) => a.commercialScore.toFixed(1),
      getScore: (a) => a.commercialScore,
    },
    {
      key: "legal",
      label: "Legal (AI)",
      getValue: (a) => a.legalScore.toFixed(1),
      getScore: (a) => a.legalScore,
    },
    {
      key: "overall",
      label: "Overall score",
      getValue: (a) => a.overallScore.toFixed(1),
      getScore: (a) => a.overallScore,
    },
  ];

  const ranked = [...parsed].sort(
    (a, b) => (b.analysis?.overallScore ?? 0) - (a.analysis?.overallScore ?? 0),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>AI comparison matrix</CardTitle>
          <p className="text-sm text-muted-foreground">
            Demo analysis across uploaded vendor proposals. Click a score cell for
            details.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-3 text-left font-medium">Criteria</th>
                  {parsed.map((p) => (
                    <th key={p.id} className="p-3 text-left font-medium">
                      {p.vendorName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground">{row.label}</td>
                    {parsed.map((p) => {
                      const analysis = p.analysis!;
                      const value = row.getValue(analysis);
                      const score = row.getScore?.(analysis);
                      return (
                        <td key={p.id} className="p-3">
                          <button
                            type="button"
                            className={`rounded px-2 py-1 text-left transition-colors hover:ring-2 hover:ring-ring/50 ${
                              score != null ? cellBg(score) : ""
                            }`}
                            onClick={() =>
                              setDetail({
                                vendor: p.vendorName,
                                label: row.label,
                                value,
                                quote: analysis.summary,
                              })
                            }
                          >
                            <span
                              className={
                                score != null
                                  ? `font-semibold ${scoreColor(score)}`
                                  : ""
                              }
                            >
                              {value}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">AI shortlist (demo)</p>
            <ol className="mt-2 space-y-2 text-sm">
              {ranked.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2">
                  <Badge variant="outline">#{i + 1}</Badge>
                  <span className="font-medium">{p.vendorName}</span>
                  <span className="text-muted-foreground">
                    — overall {p.analysis?.overallScore.toFixed(1)}/10
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detail)} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.vendor}</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium">{detail?.label}</p>
          <p className="text-lg font-semibold">{detail?.value}</p>
          {detail?.quote && (
            <p className="text-sm text-muted-foreground border-t pt-3">
              {detail.quote}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface VendorProposalRowProps {
  proposal: VendorProposal;
  procurementId?: string;
  onRemove?: () => void;
  onViewAnalysis?: () => void;
  onRetry?: () => void;
}

export function VendorProposalRow({
  proposal,
  procurementId,
  onRemove,
  onViewAnalysis,
  onRetry,
}: VendorProposalRowProps) {
  const statusLabel: Record<VendorProposal["status"], string> = {
    uploaded: "Queued",
    parsing: "Parsing…",
    parsing_complete: "Analysis complete",
    error: "Error",
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex items-start gap-3 min-w-0">
        <FileText className="size-5 shrink-0 text-muted-foreground mt-0.5" />
        <div className="min-w-0">
          <p className="font-medium truncate">{proposal.vendorName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {proposal.fileName}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {statusLabel[proposal.status]}
            </Badge>
            {proposal.status === "parsing" && (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            )}
            {proposal.analysis && (
              <span className="text-xs text-muted-foreground">
                Score {proposal.analysis.overallScore.toFixed(1)}/10
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {proposal.status === "error" && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
        {proposal.status === "parsing_complete" && procurementId && (
          <Button asChild variant="outline" size="sm">
            <Link
              to={`/procurement/${procurementId}/vendors/${proposal.id}/chat`}
            >
              <MessageSquare className="size-4" />
              Chat
            </Link>
          </Button>
        )}
        {proposal.status === "parsing_complete" && onViewAnalysis && (
          <Button variant="outline" size="sm" onClick={onViewAnalysis}>
            Details
          </Button>
        )}
        {onRemove && proposal.status !== "parsing" && (
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface VendorAnalysisDetailProps {
  proposal: VendorProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorAnalysisDetail({
  proposal,
  open,
  onOpenChange,
}: VendorAnalysisDetailProps) {
  const analysis = proposal.analysis;
  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>{proposal.vendorName} — AI analysis</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{analysis.summary}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded border p-2">
            <p className="text-xs text-muted-foreground">Cost</p>
            <p className="font-medium">
              {analysis.totalCost.toLocaleString()} {analysis.currency}
            </p>
          </div>
          <div className="rounded border p-2">
            <p className="text-xs text-muted-foreground">Timeline</p>
            <p className="font-medium">{analysis.timelineMonths} months</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Compliance pre-check</p>
          <ul className="space-y-2 text-sm">
            {analysis.compliance.map((row) => (
              <li key={row.requirement} className="rounded border p-2">
                <div className="flex items-center justify-between gap-2">
                  <span>{row.requirement}</span>
                  <Badge
              variant={
                row.status === "met"
                  ? "default"
                  : row.status === "not_met"
                    ? "destructive"
                    : "secondary"
              }
            >
              {row.status.replace("_", " ")}
            </Badge>
                </div>
                {row.quote && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    “{row.quote}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {analysis.risks.length > 0 && (
          <div>
            <p className="text-sm font-medium">Risks</p>
            <ul className="text-sm text-muted-foreground list-disc pl-4">
              {analysis.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
