import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Upload, Sparkles, Trophy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageWorkspace } from "@/components/layout/page-scroll";
import { ProcurementWorkflowNav } from "@/components/procurement/procurement-workflow-nav";
import { ProcurementStatusBadge } from "@/components/procurement/status-badge";
import {
  VendorAnalysisDetail,
  VendorComparisonMatrix,
  VendorProposalRow,
} from "@/components/procurement/vendor-comparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Can } from "@casl/react";
import {
  addVendorProposal,
  completeVendorProposalAnalysis,
  removeVendorProposal,
  setAwardedVendor,
  setVendorProposalStatus,
} from "@/features/procurement/procurementSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { store } from "@/store";
import { DEMO_VENDOR_TEMPLATES } from "@/lib/mock-vendor-proposals";
import { findDemoTemplate, buildDemoAnalysis, applyRfpBudgetToAnalysis, extractBudgetCapUsd } from "@/lib/vendor-analysis";
import { runProposalAnalysis } from "@/lib/langgraph-client";
import { extractProposalText } from "@/lib/extract-proposal-file";
import type { VendorProposal } from "@/types";

const MAX_PROPOSALS = 4;

export function ProcurementVendorsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((s) =>
    s.procurement.events.find((e) => e.id === id),
  );

  const [vendorName, setVendorName] = useState("");
  const [detailProposal, setDetailProposal] = useState<VendorProposal | null>(
    null,
  );
  const [awardProposal, setAwardProposal] = useState<VendorProposal | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const parsingRef = useRef<Set<string>>(new Set());
  const budgetSyncKeyRef = useRef<string>("");

  const proposals = event?.vendorProposals ?? [];
  const parsedCount = proposals.filter(
    (p) => p.status === "parsing_complete",
  ).length;
  const canAddMore = proposals.length < MAX_PROPOSALS;

  const runAnalysis = async (
    procurementId: string,
    proposalId: string,
    name: string,
    fileName: string,
    proposalText?: string,
    rfpMarkdown?: string,
  ) => {
    if (parsingRef.current.has(proposalId)) return;
    parsingRef.current.add(proposalId);

    const currentRfp =
      rfpMarkdown ??
      store.getState().procurement.events.find((e) => e.id === procurementId)
        ?.rfpMarkdown;

    dispatch(
      setVendorProposalStatus({
        procurementId,
        proposalId,
        status: "parsing",
      }),
    );

    const finalize = (raw: VendorProposalAnalysis) => {
      dispatch(
        completeVendorProposalAnalysis({
          procurementId,
          proposalId,
          analysis: applyRfpBudgetToAnalysis(raw, currentRfp),
        }),
      );
    };

    try {
      const analysis = await runProposalAnalysis({
        vendorName: name,
        fileName,
        rfpMarkdown: currentRfp,
        proposalText,
      });
      finalize(analysis);
      toast.success(`AI analysis complete for ${name}`);
    } catch (error) {
      const template = findDemoTemplate(name);
      if (template) {
        finalize({ ...template.analysis });
        toast.warning(
          "LangGraph unavailable — used local demo analysis. Start langgraph dev.",
        );
      } else {
        finalize(buildDemoAnalysis(name, fileName));
        toast.warning(
          "LangGraph unavailable — used generated demo scores. Start langgraph dev.",
        );
      }
      console.error(error);
    } finally {
      parsingRef.current.delete(proposalId);
    }
  };

  const handleAddAndAnalyze = (
    name: string,
    fileName: string,
    fileSize?: number,
    proposalText?: string,
  ) => {
    if (!id) return;

    const proposalId = crypto.randomUUID();
    dispatch(
      addVendorProposal({
        procurementId: id,
        vendorName: name,
        fileName,
        fileSize,
        proposalId,
        proposalText,
      }),
    );

    void runAnalysis(
      id,
      proposalId,
      name,
      fileName,
      proposalText ?? findDemoTemplate(name)?.proposalText,
      event?.rfpMarkdown,
    );
  };

  const handleFileUpload = async (file: File) => {
    if (!event) return;
    const name = vendorName.trim() || file.name.replace(/\.[^.]+$/, "");

    if (!name) {
      toast.error("Enter a vendor name first");
      return;
    }

    let proposalText: string | undefined;
    try {
      proposalText = await extractProposalText(file);
      if (!proposalText.trim()) {
        toast.error("No text found in the document.");
        return;
      }
      toast.info(`Extracted text from ${file.name} — running AI analysis…`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not read the file.";
      toast.error(message);
      return;
    }

    handleAddAndAnalyze(name, file.name, file.size, proposalText);
    setVendorName("");
  };

  const loadDemoVendor = (templateIndex: number) => {
    if (!id) return;
    const template = DEMO_VENDOR_TEMPLATES[templateIndex];
    if (!template) return;

    const currentEvent = store
      .getState()
      .procurement.events.find((e) => e.id === id);
    const currentProposals = currentEvent?.vendorProposals ?? [];

    if (currentProposals.some((p) => p.vendorName === template.vendorName)) {
      toast.error(`${template.vendorName} is already uploaded`);
      return;
    }

    if (currentProposals.length >= MAX_PROPOSALS) {
      toast.error(`Maximum ${MAX_PROPOSALS} vendor proposals`);
      return;
    }

    handleAddAndAnalyze(template.vendorName, template.fileName);
    toast.info(`Analyzing ${template.vendorName}…`);
  };

  const loadAllDemoVendors = () => {
    DEMO_VENDOR_TEMPLATES.forEach((t, i) => {
      setTimeout(() => loadDemoVendor(i), i * 400);
    });
  };

  const retryAnalysis = (proposal: VendorProposal) => {
    if (!id) return;
    void runAnalysis(
      id,
      proposal.id,
      proposal.vendorName,
      proposal.fileName,
      proposal.proposalText ??
        findDemoTemplate(proposal.vendorName)?.proposalText,
      event?.rfpMarkdown,
    );
  };

  const retryAllFailed = () => {
    proposals
      .filter((p) => p.status === "error")
      .forEach((p) => retryAnalysis(p));
  };

  const reanalyzeAll = () => {
    if (!id) return;
    proposals
      .filter((p) => p.status === "parsing_complete" || p.status === "error")
      .forEach((p) => retryAnalysis(p));
    toast.success("Re-analyzing vendors against the current RFP");
  };

  const refreshComplianceFromRfp = () => {
    if (!id || !event?.rfpMarkdown) return;
    let updatedCount = 0;
    for (const p of proposals) {
      if (p.status !== "parsing_complete" || !p.analysis) continue;
      const next = applyRfpBudgetToAnalysis(p.analysis, event.rfpMarkdown);
      const changed =
        JSON.stringify(next.compliance) !== JSON.stringify(p.analysis.compliance) ||
        next.commercialScore !== p.analysis.commercialScore ||
        next.overallScore !== p.analysis.overallScore;
      if (!changed) continue;
      updatedCount += 1;
      dispatch(
        completeVendorProposalAnalysis({
          procurementId: id,
          proposalId: p.id,
          analysis: next,
        }),
      );
    }
    if (updatedCount > 0) {
      toast.success(`Updated ${updatedCount} vendor(s) to match current RFP budget`);
    } else {
      toast.info("Compliance already matches the current RFP");
    }
  };

  const rfpBudgetCap = extractBudgetCapUsd(event?.rfpMarkdown ?? "");

  useEffect(() => {
    if (!id || !event?.rfpMarkdown || proposals.length === 0) return;
    const syncKey = `${id}:${event.rfpMarkdown.length}:${rfpBudgetCap ?? "none"}`;
    if (budgetSyncKeyRef.current === syncKey) return;
    budgetSyncKeyRef.current = syncKey;

    for (const p of proposals) {
      if (p.status !== "parsing_complete" || !p.analysis) continue;
      const next = applyRfpBudgetToAnalysis(p.analysis, event.rfpMarkdown);
      if (JSON.stringify(next.compliance) === JSON.stringify(p.analysis.compliance)) {
        continue;
      }
      dispatch(
        completeVendorProposalAnalysis({
          procurementId: id,
          proposalId: p.id,
          analysis: next,
        }),
      );
    }
  }, [dispatch, event?.rfpMarkdown, id, proposals, rfpBudgetCap]);

  if (!event) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Procurement event not found.
      </div>
    );
  }

  const topProposal = [...proposals]
    .filter((p) => p.analysis)
    .sort(
      (a, b) =>
        (b.analysis?.overallScore ?? 0) - (a.analysis?.overallScore ?? 0),
    )[0];

  const failedCount = proposals.filter((p) => p.status === "error").length;

  return (
    <PageWorkspace>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-semibold">{event.title}</h1>
          <ProcurementStatusBadge status={event.status} />
        </div>
        <Can I="publish" a="RFP">
          {parsedCount > 0 && event.status !== "award_decided" && (
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                if (topProposal) setAwardProposal(topProposal);
              }}
            >
              <Trophy className="size-4" />
              Award top vendor
            </Button>
          )}
        </Can>
      </header>

      <ProcurementWorkflowNav />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-4 p-4 pb-8">
        {!event.rfpMarkdown?.trim() && (
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardContent className="py-4 text-sm">
              Generate and confirm your RFP in the <strong>RFP</strong> tab
              first, then upload vendor proposals here.
            </CardContent>
          </Card>
        )}

        {event.rfpMarkdown?.trim() && parsedCount > 0 && rfpBudgetCap && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-3 text-sm flex flex-wrap items-center justify-between gap-3">
              <p>
                Compliance is checked against your published RFP (budget cap{" "}
                <strong>${rfpBudgetCap.toLocaleString()} USD</strong>). If you
                edited the RFP after loading vendors, re-analyze.
              </p>
              <Button variant="outline" size="sm" onClick={refreshComplianceFromRfp}>
                <RefreshCw className="size-4" />
                Refresh compliance
              </Button>
              <Button variant="outline" size="sm" onClick={reanalyzeAll}>
                Re-analyze all (AI)
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upload vendor proposals</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload up to {MAX_PROPOSALS} vendor files (PDF, DOCX, or TXT).
              Text is extracted in the browser, then LangGraph AI analyzes each
              proposal against your RFP (~10–30s per file). Legacy .doc is not
              supported — save as .docx or PDF.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllDemoVendors}
                disabled={!canAddMore}
              >
                <Sparkles className="size-4" />
                Load all 4 demo vendors
              </Button>
              {failedCount > 0 && (
                <Button variant="outline" size="sm" onClick={retryAllFailed}>
                  Retry failed ({failedCount})
                </Button>
              )}
              {DEMO_VENDOR_TEMPLATES.map((t, i) => (
                <Button
                  key={t.vendorName}
                  variant="ghost"
                  size="sm"
                  disabled={
                    !canAddMore ||
                    proposals.some((p) => p.vendorName === t.vendorName)
                  }
                  onClick={() => loadDemoVendor(i)}
                >
                  {t.vendorName}
                </Button>
              ))}
            </div>

            <Can I="update" a="Procurement">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Vendor name</Label>
                  <Input
                    id="vendor-name"
                    placeholder="e.g. CloudTech Solutions"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    disabled={!canAddMore}
                  />
                </div>
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    disabled={!canAddMore}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFileUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    disabled={!canAddMore}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    Upload file
                  </Button>
                </div>
              </div>
            </Can>

            <div className="space-y-2">
              {proposals.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No proposals yet. Click <strong>Load all 4 demo vendors</strong>{" "}
                  to run LangGraph analysis (requires server at localhost:2024).
                </p>
              )}
              {proposals.map((p) => (
                <VendorProposalRow
                  key={p.id}
                  proposal={p}
                  procurementId={id}
                  onRemove={() => {
                    if (!id) return;
                    dispatch(
                      removeVendorProposal({
                        procurementId: id,
                        proposalId: p.id,
                      }),
                    );
                  }}
                  onViewAnalysis={() => setDetailProposal(p)}
                  onRetry={() => retryAnalysis(p)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <VendorComparisonMatrix proposals={proposals} />

        {event.status === "award_decided" && event.awardedVendorId && (
          <Card className="border-emerald-500/40 bg-emerald-500/10">
            <CardContent className="py-4">
              <p className="font-medium">Award decided</p>
              <p className="text-sm text-muted-foreground mt-1">
                Winning vendor:{" "}
                {proposals.find((p) => p.id === event.awardedVendorId)
                  ?.vendorName ?? "—"}
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {detailProposal && (
        <VendorAnalysisDetail
          proposal={detailProposal}
          open={Boolean(detailProposal)}
          onOpenChange={(open) => !open && setDetailProposal(null)}
        />
      )}

      <Dialog
        open={Boolean(awardProposal)}
        onOpenChange={(open) => !open && setAwardProposal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm award</DialogTitle>
            <DialogDescription>
              Award <strong>{awardProposal?.vendorName}</strong> for this
              procurement? This cannot be undone in the demo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardProposal(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!id || !awardProposal) return;
                dispatch(
                  setAwardedVendor({
                    procurementId: id,
                    proposalId: awardProposal.id,
                  }),
                );
                setAwardProposal(null);
                toast.success(`Award granted to ${awardProposal.vendorName}`);
              }}
            >
              Confirm award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWorkspace>
  );
}
