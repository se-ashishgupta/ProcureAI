import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StreamProvider, useStreamContext } from "@langchain/react";
import { HumanMessage } from "@langchain/core/messages";
import { MessageSquare } from "lucide-react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatComposer } from "@/components/chat/chat-composer";
import { PageWorkspace } from "@/components/layout/page-scroll";
import { ProcurementWorkflowNav } from "@/components/procurement/procurement-workflow-nav";
import { RfpEditorPanel } from "@/components/procurement/rfp-editor-panel";
import { RfpTemplatePicker } from "@/components/procurement/rfp-template-picker";
import { ProcurementStatusBadge } from "@/components/procurement/status-badge";
import { Button } from "@/components/ui/button";
import { Can } from "@casl/react";
import {
  setProcurementStatus,
  updateProcurement,
} from "@/features/procurement/procurementSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RfpGraphState, RfpTemplate } from "@/types";
import { normalizeTemplateSections } from "@/components/procurement/rfp-template-sections-editor";
import { saveCustomTemplate } from "@/lib/rfp-templates";
import { toast } from "sonner";

const LANGGRAPH_API_URL =
  import.meta.env.VITE_LANGGRAPH_API_URL ?? "http://localhost:2024";
const ASSISTANT_ID =
  import.meta.env.VITE_ASSISTANT_ID ?? "procurement_rfp_agent";

function ProcurementChatInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const stream = useStreamContext<RfpGraphState>();
  const event = useAppSelector((s) =>
    s.procurement.events.find((e) => e.id === id),
  );
  const seededRef = useRef(false);
  const templateSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTemplate = Boolean(event?.rfpTemplate?.sections?.length);
  const chatStarted =
    stream.messages.length > 0 ||
    stream.isLoading ||
    stream.interrupts.length > 0;
  const workspaceReady = hasTemplate || chatStarted;

  const startWithTemplate = useCallback(
    (template: RfpTemplate, requirement?: string) => {
      if (seededRef.current || stream.messages.length > 0) return;

      const input: Record<string, unknown> = {
        template_sections: template.sections,
        template_file_name: template.fileName,
      };

      if (requirement?.trim()) {
        seededRef.current = true;
        input.messages = [new HumanMessage(requirement.trim())];
      }

      void stream.submit(input);
    },
    [stream],
  );

  useEffect(() => {
    if (
      seededRef.current ||
      !hasTemplate ||
      !event?.requirement?.trim() ||
      stream.messages.length > 0 ||
      stream.isLoading ||
      stream.interrupts.length > 0
    ) {
      return;
    }
    seededRef.current = true;
    startWithTemplate(event.rfpTemplate!, event.requirement);
  }, [
    event?.requirement,
    event?.rfpTemplate,
    hasTemplate,
    startWithTemplate,
    stream,
  ]);

  const handleTemplateApplied = useCallback(
    (template: RfpTemplate) => {
      if (!id) return;
      dispatch(updateProcurement({ id, rfpTemplate: template }));
      toast.success(`Template applied — ${template.sections.length} sections`);
      if (event?.requirement?.trim()) {
        startWithTemplate(template, event.requirement);
      }
    },
    [dispatch, event?.requirement, id, startWithTemplate],
  );

  const handleTemplateSectionsChange = useCallback(
    (sections: string[]) => {
      if (!id || !event?.rfpTemplate) return;

      const updatedTemplate: RfpTemplate = {
        ...event.rfpTemplate,
        sections,
      };

      dispatch(updateProcurement({ id, rfpTemplate: updatedTemplate }));

      const normalized = normalizeTemplateSections(sections);

      if (templateSyncRef.current) {
        clearTimeout(templateSyncRef.current);
      }

      templateSyncRef.current = setTimeout(() => {
        if (
          updatedTemplate.source === "saved" &&
          normalized.length > 0
        ) {
          saveCustomTemplate({ ...updatedTemplate, sections: normalized });
        }

        if (chatStarted && normalized.length > 0) {
          void stream.submit({
            template_sections: normalized,
            template_file_name: updatedTemplate.fileName,
          });
        }
      }, 600);
    },
    [chatStarted, dispatch, event?.rfpTemplate, id, stream],
  );

  const handleRfpChange = useCallback(
    (markdown: string) => {
      if (!id) return;
      dispatch(updateProcurement({ id, rfpMarkdown: markdown }));
    },
    [dispatch, id],
  );

  if (!event) {
    return (
      <div className="p-8 text-muted-foreground">Procurement event not found.</div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-semibold">{event.title}</h1>
          <ProcurementStatusBadge status={event.status} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Can I="submit" a="Brief">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                dispatch(
                  setProcurementStatus({
                    id: event.id,
                    status: "brief_submitted",
                  }),
                );
                toast.success("Brief submitted for review");
              }}
            >
              Submit brief
            </Button>
          </Can>
          <Can I="approve" a="Brief">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                dispatch(
                  setProcurementStatus({
                    id: event.id,
                    status: "brief_approved",
                  }),
                );
                toast.success("Brief approved");
              }}
            >
              Approve brief
            </Button>
          </Can>
          <Can I="publish" a="RFP">
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                dispatch(
                  setProcurementStatus({
                    id: event.id,
                    status: "rfp_published",
                  }),
                );
                toast.success("RFP published — open Vendors tab to upload bids");
                navigate(`/procurement/${event.id}/vendors`);
              }}
            >
              Publish RFP
            </Button>
          </Can>
        </div>
      </header>

      <ProcurementWorkflowNav />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b lg:border-b-0 lg:border-r bg-muted/10">
          {workspaceReady ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                <ChatMessageList />
              </div>
              <ChatComposer
                templateSections={event.rfpTemplate?.sections}
                templateFileName={event.rfpTemplate?.fileName}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <MessageSquare className="size-10 opacity-40" />
              <p className="max-w-xs text-sm">
                Select a template on the right, then chat with the AI to build
                your RFP.
              </p>
            </div>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {workspaceReady ? (
            <RfpEditorPanel
              title={event.title}
              savedMarkdown={event.rfpMarkdown}
              onChange={handleRfpChange}
              template={event.rfpTemplate}
              onTemplateSectionsChange={handleTemplateSectionsChange}
            />
          ) : (
            <RfpTemplatePicker embedded onApply={handleTemplateApplied} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ProcurementChatPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((s) =>
    s.procurement.events.find((e) => e.id === id),
  );

  useEffect(() => {
    if (event && !event.threadId) {
      const threadId = crypto.randomUUID();
      dispatch(updateProcurement({ id: event.id, threadId }));
    }
  }, [dispatch, event]);

  if (!event?.threadId) {
    return <div className="p-8 text-muted-foreground">Preparing workspace...</div>;
  }

  return (
    <PageWorkspace>
      <StreamProvider
        assistantId={ASSISTANT_ID}
        apiUrl={LANGGRAPH_API_URL}
        threadId={event.threadId}
      >
        <ProcurementChatInner />
      </StreamProvider>
    </PageWorkspace>
  );
}
