import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RfpTemplateSectionsEditorProps {
  sections: string[];
  onChange: (sections: string[]) => void;
  disabled?: boolean;
  /** Shown above the list */
  hint?: string;
}

export function RfpTemplateSectionsEditor({
  sections,
  onChange,
  disabled,
  hint = "Edit section headings — the AI uses these as RFP structure.",
}: RfpTemplateSectionsEditorProps) {
  const updateAt = (index: number, value: string) => {
    const next = [...sections];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const addSection = () => {
    onChange([...sections, "New section"]);
  };

  const nonEmptyCount = sections.filter((s) => s.trim()).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <p className="shrink-0 text-xs text-muted-foreground">{hint}</p>
      <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {nonEmptyCount} section{nonEmptyCount === 1 ? "" : "s"}
      </p>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
        {sections.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No sections yet. Add one below or select a template.
          </p>
        )}
        {sections.map((section, index) => (
          <div key={`section-${index}`} className="flex items-center gap-1.5">
            <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
            <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
              {index + 1}.
            </span>
            <Input
              value={section}
              disabled={disabled}
              onChange={(e) => updateAt(index, e.target.value)}
              className="h-8 text-sm"
              placeholder="Section heading"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              onClick={() => removeAt(index)}
              aria-label="Remove section"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 w-full sm:w-auto"
        disabled={disabled}
        onClick={addSection}
      >
        <Plus className="size-4" />
        Add section
      </Button>
    </div>
  );
}

/** Trim empty rows and collapse whitespace for persistence. */
export function normalizeTemplateSections(sections: string[]): string[] {
  return sections.map((s) => s.trim()).filter(Boolean);
}
