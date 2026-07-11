import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StreamProvider, useStreamContext } from "@langchain/react";
import { HumanMessage } from "@langchain/core/messages";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageWorkspace } from "@/components/layout/page-scroll";
import { ProcurementWorkflowNav } from "@/components/procurement/procurement-workflow-nav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateVendorProposal } from "@/features/procurement/procurementSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { extractTextContent } from "@/lib/rfp-content";
import { dedupeStreamMessages } from "@/lib/chat-messages";
import type { ProposalChatState } from "@/types";

const LANGGRAPH_API_URL =
  import.meta.env.VITE_LANGGRAPH_API_URL ?? "http://localhost:2024";
const PROPOSAL_CHAT_ASSISTANT_ID =
  import.meta.env.VITE_PROPOSAL_CHAT_ASSISTANT_ID ?? "proposal_chat_agent";

function ProposalChatInner() {
  const { id, proposalId } = useParams<{ id: string; proposalId: string }>();
  const stream = useStreamContext<ProposalChatState>();
  const event = useAppSelector((s) =>
    s.procurement.events.find((e) => e.id === id),
  );
  const proposal = event?.vendorProposals?.find((p) => p.id === proposalId);
  const [input, setInput] = useState("");
  const sendingRef = useRef(false);

  const visibleMessages = dedupeStreamMessages(stream.messages);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || stream.isLoading || sendingRef.current) return;
    sendingRef.current = true;
    setInput("");
    try {
      await stream.submit({
        messages: [new HumanMessage(text)],
        vendor_name: proposal?.vendorName,
        file_name: proposal?.fileName,
        rfp_markdown: event?.rfpMarkdown ?? "",
        analysis: proposal?.analysis,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
      setInput(text);
    } finally {
      sendingRef.current = false;
    }
  };

  if (!event || !proposal) {
    return (
      <div className="p-8 text-muted-foreground">Proposal not found.</div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/procurement/${id}/vendors`}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{proposal.vendorName}</h1>
            <p className="text-xs text-muted-foreground">
              Ask questions about this proposal — AI uses parsed analysis + RFP
            </p>
          </div>
        </div>
      </header>

      <ProcurementWorkflowNav />

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 && !stream.isLoading && (
          <p className="text-sm text-muted-foreground">
            e.g. “What is their total cost?” or “Any compliance gaps?”
          </p>
        )}
        {visibleMessages.map((message, index) => {
          const isHuman =
            message.type === "human" || message.getType?.() === "human";
          const text = extractTextContent(message.content);
          if (!text.trim()) return null;
          return (
            <div
              key={message.id ?? index}
              className={
                isHuman
                  ? "rounded-lg border bg-muted/40 p-3 text-sm"
                  : "rounded-lg border bg-card p-3 text-sm"
              }
            >
              <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                {isHuman ? "You" : "AI"}
              </p>
              <p className="whitespace-pre-wrap">{text}</p>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t p-4 space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about cost, timeline, risks, compliance…"
          rows={2}
          disabled={stream.isLoading || !proposal.analysis}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => void handleSend()}
            disabled={stream.isLoading || !input.trim()}
          >
            {stream.isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VendorProposalChatPage() {
  const { id, proposalId } = useParams<{ id: string; proposalId: string }>();
  const dispatch = useAppDispatch();
  const event = useAppSelector((s) =>
    s.procurement.events.find((e) => e.id === id),
  );
  const proposal = event?.vendorProposals?.find((p) => p.id === proposalId);
  const threadIdRef = useRef<string | undefined>(proposal?.chatThreadId);

  if (proposal?.chatThreadId) {
    threadIdRef.current = proposal.chatThreadId;
  } else if (proposal && !threadIdRef.current) {
    threadIdRef.current = crypto.randomUUID();
  }

  useEffect(() => {
    if (!id || !proposalId || !proposal || proposal.chatThreadId) return;
    const threadId = threadIdRef.current;
    if (!threadId) return;
    dispatch(
      updateVendorProposal({
        procurementId: id,
        proposalId,
        patch: { chatThreadId: threadId },
      }),
    );
  }, [dispatch, id, proposalId, proposal]);

  if (!event || !proposal?.analysis) {
    return (
      <PageWorkspace>
        <div className="p-8 text-muted-foreground">
          Complete proposal analysis before opening chat.
        </div>
      </PageWorkspace>
    );
  }

  const threadId = proposal.chatThreadId ?? threadIdRef.current;
  if (!threadId) {
    return (
      <PageWorkspace>
        <div className="p-8 text-muted-foreground">Preparing chat…</div>
      </PageWorkspace>
    );
  }

  return (
    <PageWorkspace>
      <StreamProvider
        assistantId={PROPOSAL_CHAT_ASSISTANT_ID}
        apiUrl={LANGGRAPH_API_URL}
        threadId={threadId}
      >
        <ProposalChatInner />
      </StreamProvider>
    </PageWorkspace>
  );
}
