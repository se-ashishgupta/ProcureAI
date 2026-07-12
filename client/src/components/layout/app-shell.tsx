import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, FileText, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Can } from "@casl/react";
import { logout } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    subject: "Dashboard" as const,
    action: "read" as const,
  },
  {
    to: "/procurement",
    label: "Procurement",
    icon: FileText,
    subject: "Procurement" as const,
    action: "read" as const,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    subject: "User" as const,
    action: "manage" as const,
  },
  {
    to: "/admin/org",
    label: "Organization",
    icon: Building2,
    subject: "Org" as const,
    action: "manage" as const,
  },
];

export function AppShell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="border-r bg-card w-64 shrink-0 p-4 flex flex-col gap-4">
        <div>
          <p className="text-lg font-semibold tracking-tight">ProcureAI</p>
          <p className="text-xs text-muted-foreground">Procurement intelligence</p>
        </div>
        <Separator />
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Can key={item.to} I={item.action} a={item.subject}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            </Can>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-muted-foreground capitalize">{user?.role.replace("_", " ")}</p>
          </div>
          <div className="flex items-center w-full  gap-2 justify-between">
            <ThemeToggle className="shrink-0" align="start" />
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                dispatch(logout());
                navigate("/login");
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
