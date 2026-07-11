import { Link, useLocation, useParams } from "react-router-dom";
import { MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "rfp", label: "RFP", suffix: "/chat", icon: MessageSquare },
  { key: "vendors", label: "Vendors", suffix: "/vendors", icon: Users },
] as const;

export function ProcurementWorkflowNav() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  if (!id) return null;

  const base = `/procurement/${id}`;

  return (
    <nav className="flex shrink-0 items-center gap-1 border-b bg-muted/20 px-4 py-1.5">
      {STEPS.map((step) => {
        const path = `${base}${step.suffix}`;
        const active = location.pathname === path;
        const Icon = step.icon;
        return (
          <Link
            key={step.key}
            to={path}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
