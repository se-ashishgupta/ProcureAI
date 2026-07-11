import { useMemo } from "react";
import { useStreamContext } from "@langchain/react";
import type { BaseMessage } from "@langchain/core/messages";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  extractTextContent,
  isFullRfpDocument,
  isInternalAgentPayload,
} from "@/lib/rfp-content";
import { dedupeStreamMessages } from "@/lib/chat-messages";
import type { RfpGraphState } from "@/types";

function messageText(message: BaseMessage): string {
  return extractTextContent(message.content);
}

function shouldShowInChat(message: BaseMessage, text: string): boolean {
  if (message.id?.startsWith("do-not-render-")) return false;
  if (!text.trim()) return false;
  if (isInternalAgentPayload(text)) return false;
  if (isFullRfpDocument(text)) return false;
  return true;
}

export function ChatMessageList() {
  const stream = useStreamContext<RfpGraphState>();
  const interrupt = stream.interrupts[0];
  const interruptPrompt =
    interrupt?.value &&
    typeof interrupt.value === "object" &&
    interrupt.value !== null &&
    "assistant_message" in interrupt.value
      ? String((interrupt.value as { assistant_message?: string }).assistant_message ?? "")
      : "";

  const visibleMessages = useMemo(() => {
    return dedupeStreamMessages(stream.messages).filter((message) => {
      const text = messageText(message);
      if (!shouldShowInChat(message, text)) return false;

      const isAi = message.type === "ai" || message.getType?.() === "ai";
      // When interrupted, the banner already shows the pending question.
      if (interrupt && isAi && interruptPrompt && text.trim() === interruptPrompt.trim()) {
        return false;
      }
      return true;
    });
  }, [stream.messages, interrupt, interruptPrompt]);

  return (
    <div className="flex flex-col gap-4">
      {visibleMessages.length === 0 && !interrupt && (
        <p className="text-sm text-muted-foreground">
          Describe your procurement need. The AI will ask clarifying questions,
          then generate an RFP you can review and export.
        </p>
      )}
      {visibleMessages.map((message, index) => {
        const isHuman =
          message.type === "human" || message.getType?.() === "human";
        const text = messageText(message);

        return (
          <div
            key={message.id ?? index}
            className={
              isHuman
                ? "rounded-lg border bg-muted/40 p-3 text-sm"
                : "rounded-lg border bg-card p-3 text-sm"
            }
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isHuman ? "You" : "Agent"}
            </p>
            {isHuman ? (
              <p className="max-h-64 overflow-y-auto whitespace-pre-wrap overscroll-contain">
                {text}
              </p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}
      {interrupt && (
        <div className="sticky bottom-0 z-10 pt-2 pb-1">
          <InterruptBanner />
        </div>
      )}
    </div>
  );
}

export function InterruptBanner() {
  const stream = useStreamContext<RfpGraphState>();
  const interrupt = stream.interrupts[0];

  const payload = useMemo(() => {
    if (!interrupt?.value) return null;
    return interrupt.value as Record<string, unknown>;
  }, [interrupt]);

  if (!interrupt || !payload) return null;

  const stage = String(payload.stage ?? "gather");
  const isReview =
    payload.type === "rfp_review" || stage === "review" || stage === "review_edit";
  const assistantMessage =
    typeof payload.assistant_message === "string"
      ? payload.assistant_message
      : "";

  return (
    <div
      className={
        isReview
          ? "rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm shadow-sm"
          : "rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm shadow-sm"
      }
    >
      <p className="font-medium">
        {isReview ? "Step 2 — Final RFP review" : "Step 1 — Your input is required"}
      </p>
      <p className="mt-1 text-muted-foreground">
        {isReview
          ? "Your RFP was generated. Review it in the Preview panel on the right, then type confirm below to finish — or describe edits to regenerate."
          : "Answer in the box below with budget, timeline, and evaluation criteria, then click Resume."}
      </p>
      {assistantMessage && (
        <div className="mt-3 max-h-40 overflow-y-auto overscroll-contain rounded-md border bg-background/60 p-3 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {assistantMessage}
          </ReactMarkdown>
        </div>
      )}
      {Array.isArray(payload.missing_critical) &&
        payload.missing_critical.length > 0 && (
          <p className="mt-2 text-xs font-medium text-foreground">
            Still needed: {(payload.missing_critical as string[]).join(", ")}
          </p>
        )}
    </div>
  );
}
