import { useState } from "react";
import { useStreamContext } from "@langchain/react";
import { HumanMessage } from "@langchain/core/messages";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { RfpGraphState } from "@/types";

interface ChatComposerProps {
  templateSections?: string[];
  templateFileName?: string;
}

function isReviewInterrupt(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { type?: string; stage?: string };
  return v.type === "rfp_review" || v.stage === "review";
}

export function ChatComposer({
  templateSections,
  templateFileName,
}: ChatComposerProps = {}) {
  const stream = useStreamContext<RfpGraphState>();
  const [input, setInput] = useState("");
  const interrupt = stream.interrupts[0];
  const hasInterrupt = Boolean(interrupt);
  const isReview = hasInterrupt && isReviewInterrupt(interrupt?.value);
  const isBusy = stream.isLoading;

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");

    try {
      if (hasInterrupt) {
        await stream.respond(
          text,
          interrupt?.id ? { interruptId: interrupt.id } : undefined,
        );
      } else {
        const payload: Record<string, unknown> = {
          messages: [new HumanMessage(text)],
        };
        const hasTemplateInState = Boolean(
          stream.values?.template_sections?.length,
        );
        if (templateSections?.length && !hasTemplateInState) {
          payload.template_sections = templateSections;
          payload.template_file_name = templateFileName ?? "";
        }
        await stream.submit(payload);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
      setInput(text);
    }
  };

  const missing = stream.values?.missing_critical;
  const actionLabel = hasInterrupt ? "Resume" : "Send";

  return (
    <div className="shrink-0 border-t bg-background/95 p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-sm supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {hasInterrupt && !isReview && Array.isArray(missing) && missing.length > 0 && (
          <p className="text-xs text-muted-foreground px-1">
            Still needed: {missing.join(", ")}
          </p>
        )}

        <div className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-sm">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            placeholder={
              isReview
                ? 'Type "confirm" to finalize, or describe edits…'
                : hasInterrupt
                  ? "Your answer — budget, timeline, evaluation criteria…"
                  : "Describe your procurement requirement…"
            }
            rows={isReview ? 2 : 3}
            className="field-sizing-fixed min-h-11 max-h-36 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />
          <Button
            className="shrink-0 gap-1.5"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={isBusy || !input.trim()}
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {actionLabel}
          </Button>
        </div>

        <p className="px-1 text-[11px] text-muted-foreground">
          {isBusy ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Agent is working…
            </span>
          ) : isReview ? (
            <>Enter to {actionLabel.toLowerCase()} · Shift+Enter for new line</>
          ) : (
            <>Enter to {actionLabel.toLowerCase()} · Shift+Enter for new line</>
          )}
        </p>
      </div>
    </div>
  );
}
