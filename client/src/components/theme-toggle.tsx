import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  align?: "start" | "center" | "end";
};

export function ThemeToggle({ className, align = "end" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("relative", className)}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="size-4" />
          Light
          {theme === "light" ? <span className="ml-auto text-xs text-muted-foreground">Active</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="size-4" />
          Dark
          {theme === "dark" ? <span className="ml-auto text-xs text-muted-foreground">Active</span> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="size-4" />
          System
          {theme === "system" ? <span className="ml-auto text-xs text-muted-foreground">Active</span> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
