import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Scrollable page body inside the app shell (dashboard, lists, admin). */
export function PageScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
      <div className={cn("p-8", className)}>{children}</div>
    </div>
  );
}

/** Full-height workspace (chat) — no outer scroll; children manage their own panes. */
export function PageWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
