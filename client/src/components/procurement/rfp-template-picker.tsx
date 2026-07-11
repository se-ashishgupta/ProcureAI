import { useRef, useState } from "react";
import { FileText, Loader2, Upload, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RfpTemplateSectionsEditor,
  normalizeTemplateSections,
} from "@/components/procurement/rfp-template-sections-editor";
import { detectTemplateSections } from "@/lib/detect-template-sections";
import { extractDocumentText, extractDocumentTextFromUrl } from "@/lib/extract-document-text";
import {
  BUILT_IN_RFP_TEMPLATES,
  deleteCustomTemplate,
  findBuiltInFallbackForFile,
  loadCustomTemplates,
  saveCustomTemplate,
} from "@/lib/rfp-templates";
import type { RfpTemplate } from "@/types";

interface RfpTemplatePickerProps {
  selected?: RfpTemplate;
  onApply: (template: RfpTemplate) => void;
  disabled?: boolean;
  /** Fill parent panel without outer Card — for right-side workspace. */
  embedded?: boolean;
}

export function RfpTemplatePicker({
  selected,
  onApply,
  disabled,
  embedded = false,
}: RfpTemplatePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeBuiltInId, setActiveBuiltInId] = useState(
    BUILT_IN_RFP_TEMPLATES[0]?.id ?? "",
  );
  const [customTemplates, setCustomTemplates] = useState(loadCustomTemplates);
  const [detectedSections, setDetectedSections] = useState<string[]>(
    selected?.sections ?? [],
  );
  const [pendingName, setPendingName] = useState(selected?.name ?? "");
  const [pendingFileName, setPendingFileName] = useState(
    selected?.fileName ?? "",
  );
  const [pendingSource, setPendingSource] = useState<RfpTemplate["source"]>(
    selected?.source ?? "builtin",
  );
  const [pendingId, setPendingId] = useState(selected?.id ?? activeBuiltInId);
  const [pendingAssetUrl, setPendingAssetUrl] = useState(selected?.assetUrl);
  const [loading, setLoading] = useState(false);

  const applySections = (
    sections: string[],
    meta: {
      id: string;
      name: string;
      fileName: string;
      source: RfpTemplate["source"];
      assetUrl?: string;
    },
  ) => {
    if (sections.length === 0) {
      toast.error("No sections detected in this template.");
      return;
    }
    setDetectedSections(sections);
    setPendingName(meta.name);
    setPendingFileName(meta.fileName);
    setPendingSource(meta.source);
    setPendingId(meta.id);
    setPendingAssetUrl(meta.assetUrl);
    toast.success(`Detected ${sections.length} sections`);
  };

  const handleBuiltInSelect = async (builtInId: string) => {
    const builtIn = BUILT_IN_RFP_TEMPLATES.find((t) => t.id === builtInId);
    if (!builtIn) return;

    setActiveBuiltInId(builtInId);
    setLoading(true);
    try {
      const text = await extractDocumentTextFromUrl(builtIn.assetUrl);
      const sections = detectTemplateSections(text);
      applySections(
        sections.length >= 3 ? sections : builtIn.fallbackSections,
        {
          id: builtIn.id,
          name: builtIn.name,
          fileName: builtIn.fileName,
          source: "builtin",
          assetUrl: builtIn.assetUrl,
        },
      );
    } catch {
      applySections(builtIn.fallbackSections, {
        id: builtIn.id,
        name: builtIn.name,
        fileName: builtIn.fileName,
        source: "builtin",
        assetUrl: builtIn.assetUrl,
      });
      toast.warning("Used built-in section list (could not parse PDF in browser).");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const text = await extractDocumentText(file);
      let sections = detectTemplateSections(text);
      const knownBuiltIn = findBuiltInFallbackForFile(file.name);

      if (sections.length < 3 && knownBuiltIn) {
        sections = knownBuiltIn.fallbackSections;
        toast.info(
          `Used known section list for ${knownBuiltIn.name} (${sections.length} sections).`,
        );
      } else if (sections.length === 0) {
        toast.error(
          "No sections detected. Try DOCX, or ensure the PDF has a Contents / numbered headings section.",
        );
        return;
      }

      applySections(sections, {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ""),
        fileName: file.name,
        source: "upload",
      });
    } catch (error) {
      const knownBuiltIn = findBuiltInFallbackForFile(file.name);
      if (knownBuiltIn) {
        applySections(knownBuiltIn.fallbackSections, {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, ""),
          fileName: file.name,
          source: "upload",
        });
        toast.warning(
          `Could not read PDF text — used ${knownBuiltIn.fallbackSections.length} predefined sections.`,
        );
        return;
      }
      const message =
        error instanceof Error ? error.message : "Could not read template file.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    const sections = normalizeTemplateSections(detectedSections);
    if (sections.length === 0) {
      toast.error("Add at least one section before continuing.");
      return;
    }

    const template: RfpTemplate = {
      id: pendingId,
      name: pendingName,
      fileName: pendingFileName,
      source: pendingSource,
      sections,
      assetUrl: pendingAssetUrl,
    };

    if (pendingSource === "upload") {
      saveCustomTemplate({ ...template, source: "saved" });
      setCustomTemplates(loadCustomTemplates());
    }

    onApply(template);
  };

  const handleSavedSelect = (template: RfpTemplate) => {
    applySections(template.sections, {
      id: template.id,
      name: template.name,
      fileName: template.fileName,
      source: "saved",
      assetUrl: template.assetUrl,
    });
  };

  const inner = (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Built-in templates
        </p>
        <div className="flex flex-wrap gap-2">
          {BUILT_IN_RFP_TEMPLATES.map((t) => (
            <Button
              key={t.id}
              variant={activeBuiltInId === t.id ? "default" : "outline"}
              size="sm"
              disabled={disabled || loading}
              onClick={() => void handleBuiltInSelect(t.id)}
            >
              {t.name}
            </Button>
          ))}
        </div>
      </div>

      {customTemplates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your saved templates
          </p>
          <div className="flex flex-wrap gap-2">
            {customTemplates.map((t) => (
              <div key={t.id} className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || loading}
                  onClick={() => handleSavedSelect(t)}
                >
                  {t.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={disabled || loading}
                  onClick={() => {
                    deleteCustomTemplate(t.id);
                    setCustomTemplates(loadCustomTemplates());
                    toast.success("Template removed");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          disabled={disabled || loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loading}
          onClick={() => fileRef.current?.click()}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload template (PDF / DOCX)
        </Button>
        {pendingFileName && (
          <span className="text-xs text-muted-foreground truncate max-w-xs">
            {pendingFileName}
          </span>
        )}
      </div>

      {(detectedSections.length > 0 || pendingFileName) && (
        <div className="rounded-lg border bg-muted/30 p-3 min-h-[200px] max-h-[min(360px,40vh)] flex flex-col">
          <RfpTemplateSectionsEditor
            sections={detectedSections}
            disabled={disabled || loading}
            onChange={setDetectedSections}
            hint="Review detected sections — edit, add, or remove before starting."
          />
        </div>
      )}

      <Button
        onClick={handleApply}
        disabled={
          disabled ||
          loading ||
          normalizeTemplateSections(detectedSections).length === 0
        }
        className="w-full sm:w-auto"
      >
        <Check className="size-4" />
        Use this template & start RFP
      </Button>
      {detectedSections.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select a built-in template or upload a file first — sections will
          appear above once detected.
        </p>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-3 py-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FileText className="size-4" />
            Choose RFP template
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick or upload a template — section headings define your RFP structure.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {inner}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="size-4" />
          Choose RFP template
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a stored template or upload your own PDF/DOCX. We detect section
          headings only — the AI will generate your RFP using that structure.
        </p>
      </CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  );
}

/** Editable template sections for the right-panel Template tab. */
export function RfpTemplateDetailPanel({
  template,
  onSectionsChange,
}: {
  template: RfpTemplate;
  onSectionsChange?: (sections: string[]) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 space-y-1 border-b pb-3">
        <p className="font-medium">{template.name}</p>
        <p className="text-sm text-muted-foreground">{template.fileName}</p>
        <span className="inline-flex rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
          {template.source === "builtin"
            ? "Built-in"
            : template.source === "saved"
              ? "Saved"
              : "Uploaded"}
        </span>
      </div>
      <div className="min-h-0 flex-1 pt-3">
        <RfpTemplateSectionsEditor
          sections={template.sections}
          onChange={(sections) => onSectionsChange?.(sections)}
          hint="Edit section headings — changes apply to the next AI generation."
        />
      </div>
    </div>
  );
}

/** @deprecated Use Template tab in RfpEditorPanel instead. */
export function RfpTemplateSummary({ template }: { template: RfpTemplate }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <FileText className="size-3.5 shrink-0" />
      <span className="font-medium text-foreground">{template.name}</span>
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        {template.sections.length} sections
      </Badge>
      <span className="truncate">{template.fileName}</span>
    </div>
  );
}
