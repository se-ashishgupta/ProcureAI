import { useEffect, useMemo, useState } from "react";
import { useStreamContext } from "@langchain/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileDown, FileType2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RfpTemplateDetailPanel } from "@/components/procurement/rfp-template-picker";
import { exportMarkdownAsDocx, exportMarkdownAsPdf } from "@/lib/export-document";
import { draftToMarkdown, normalizeMarkdownContent } from "@/lib/rfp-content";
import type { RfpGraphState, RfpTemplate } from "@/types";
import { cn } from "@/lib/utils";

interface RfpEditorPanelProps {
  savedMarkdown?: string;
  onChange: (markdown: string) => void;
  title: string;
  template?: RfpTemplate;
  onTemplateSectionsChange?: (sections: string[]) => void;
}

type PanelTab = "preview" | "edit" | "template";

export function RfpEditorPanel({
  savedMarkdown,
  onChange,
  title,
  template,
  onTemplateSectionsChange,
}: RfpEditorPanelProps) {
  const stream = useStreamContext<RfpGraphState>();
  const values = stream.values;
  const interrupt = stream.interrupts[0];
  const [tab, setTab] = useState<PanelTab>("preview");

  const interruptRfp = useMemo(() => {
    const value = interrupt?.value;
    if (!value || typeof value !== "object") return "";
    const md = (value as { rfp_markdown?: string }).rfp_markdown;
    return typeof md === "string" ? normalizeMarkdownContent(md) : "";
  }, [interrupt]);

  const liveContent = useMemo(() => {
    const rfp = values?.rfp_markdown;
    if (typeof rfp === "string" && rfp.trim()) {
      return normalizeMarkdownContent(rfp);
    }
    if (interruptRfp) return interruptRfp;
    const brief = draftToMarkdown(values?.draft as Record<string, unknown>);
    if (brief) return brief;
    return normalizeMarkdownContent(savedMarkdown ?? "");
  }, [values?.rfp_markdown, values?.draft, savedMarkdown, interruptRfp]);

  const isFinalRfp = Boolean(
    normalizeMarkdownContent(values?.rfp_markdown ?? "") || interruptRfp,
  );

  const [editorValue, setEditorValue] = useState(liveContent);

  useEffect(() => {
    if (liveContent) {
      setEditorValue(liveContent);
      onChange(liveContent);
    }
  }, [liveContent, onChange]);

  useEffect(() => {
    if (isFinalRfp) setTab("preview");
  }, [isFinalRfp]);

  const handleChange = (value: string) => {
    const normalized = normalizeMarkdownContent(value);
    setEditorValue(normalized);
    onChange(normalized);
  };

  const baseName = title.replace(/\s+/g, "-").toLowerCase() || "rfp";

  const tabs: PanelTab[] = template
    ? ["preview", "edit", "template"]
    : ["preview", "edit"];

  const tabLabels: Record<PanelTab, string> = {
    preview: "Preview",
    edit: "Edit",
    template: "Template",
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-card">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            {tabs.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTab(mode)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                  tab === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tabLabels[mode]}
              </button>
            ))}
          </div>
        </div>
        {tab !== "template" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!editorValue}
              onClick={() =>
                exportMarkdownAsDocx(editorValue, `${baseName}.docx`)
              }
            >
              <FileType2 className="size-3.5" />
              DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!editorValue}
              onClick={() => exportMarkdownAsPdf(editorValue, `${baseName}.pdf`)}
            >
              <FileDown className="size-3.5" />
              PDF
            </Button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        {tab === "template" && template ? (
          <RfpTemplateDetailPanel
            template={template}
            onSectionsChange={onTemplateSectionsChange}
          />
        ) : tab === "edit" ? (
          <Textarea
            className="field-sizing-fixed h-full min-h-0 flex-1 resize-none overflow-y-auto font-mono text-sm leading-relaxed"
            value={editorValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Your structured brief or generated RFP will appear here..."
          />
        ) : (
          <div className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border bg-background p-5">
            <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-4 prose-p:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {editorValue || "_No content yet._"}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
