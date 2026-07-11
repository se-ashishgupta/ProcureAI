import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageScroll } from "@/components/layout/page-scroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addOrgUser,
  removeOrgUser,
  setUserRole,
  updateOrg,
} from "@/features/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  procurement_manager: "Procurement Manager",
  viewer: "Viewer",
};

function RoleBadge({ role }: { role: UserRole }) {
  const variant =
    role === "admin"
      ? "default"
      : role === "procurement_manager"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{ROLE_LABELS[role]}</Badge>;
}

export function AdminOrgPage() {
  const dispatch = useAppDispatch();
  const org = useAppSelector((s) => s.admin.org);
  const userCount = useAppSelector((s) => s.admin.users.length);
  const eventCount = useAppSelector((s) => s.procurement.events.length);

  const handleSave = () => {
    dispatch(updateOrg(org));
    toast.success("Organization settings saved");
  };

  return (
    <PageScroll className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Organization setup</h1>
        <p className="text-muted-foreground">
          Configure your company profile and procurement policy for the demo
          workspace.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{userCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Procurement events</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{eventCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Org ID</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono text-muted-foreground">
            {org.id}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Company profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={org.name}
                onChange={(e) =>
                  dispatch(updateOrg({ name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-industry">Industry</Label>
              <Input
                id="org-industry"
                value={org.industry}
                onChange={(e) =>
                  dispatch(updateOrg({ industry: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-website">Website</Label>
              <Input
                id="org-website"
                type="url"
                value={org.website ?? ""}
                onChange={(e) =>
                  dispatch(updateOrg({ website: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-logo">Logo label</Label>
              <Input
                id="org-logo"
                maxLength={3}
                value={org.logoLabel ?? ""}
                onChange={(e) =>
                  dispatch(updateOrg({ logoLabel: e.target.value }))
                }
                placeholder="PA"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-policy">Procurement policy summary</Label>
            <Textarea
              id="org-policy"
              rows={4}
              value={org.policySummary}
              onChange={(e) =>
                dispatch(updateOrg({ policySummary: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>Save settings</Button>
            <Button asChild variant="outline">
              <Link to="/admin/users">
                <Users className="size-4" />
                Manage users
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageScroll>
  );
}

export function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.admin.users);
  const currentUser = useAppSelector((s) => s.auth.user);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  const adminCount = users.filter((u) => u.role === "admin").length;

  const handleAddUser = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (
      users.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      )
    ) {
      toast.error("That email is already on the roster");
      return;
    }
    dispatch(
      addOrgUser({
        name,
        email,
        role,
        password,
      }),
    );
    toast.success(`Added ${name.trim()}`);
    setName("");
    setEmail("");
    setPassword("");
    setRole("viewer");
    setDialogOpen(false);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.role === "admin" && newRole !== "admin" && adminCount <= 1) {
      toast.error("At least one admin is required");
      return;
    }
    dispatch(setUserRole({ userId, role: newRole }));
    toast.success(`Updated role for ${target.name}`);
  };

  const handleRemove = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === "user-admin" || target.role === "admin" && adminCount <= 1) {
      toast.error("Cannot remove the last admin account");
      return;
    }
    dispatch(removeOrgUser(userId));
    toast.success(`Removed ${target.name}`);
  };

  return (
    <PageScroll className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users & roles</h1>
          <p className="text-muted-foreground">
            Assign RBAC roles. Changes apply on the user&apos;s next sign-in.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add user
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization roster</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, value as UserRole)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="procurement_manager">
                          Procurement Manager
                        </SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={user.id === "user-admin"}
                      onClick={() => handleRemove(user.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <RoleBadge role="admin" />
            <span className="text-muted-foreground">
              Full access — org setup, users, procurement, publish RFP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role="procurement_manager" />
            <span className="text-muted-foreground">
              Create procurement events, submit briefs, publish RFPs, upload
              vendors
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role="viewer" />
            <span className="text-muted-foreground">
              Read-only — view dashboard and procurement progress
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Demo accounts store credentials locally for hackathon testing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-name">Full name</Label>
              <Input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="procurement_manager">
                    Procurement Manager
                  </SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add user</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageScroll>
  );
}
