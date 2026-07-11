import { Link } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageScroll } from "@/components/layout/page-scroll";
import { ProcurementStatusBadge } from "@/components/procurement/status-badge";
import {
  formatCreatorRole,
  formatProcurementCreatorDetail,
} from "@/lib/procurement-meta";
import { useAppSelector } from "@/store/hooks";

export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const events = useAppSelector((s) => s.procurement.events);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "procurement_manager";

  return (
    <PageScroll className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Organization setup and governance overview"
            : isManager
              ? "Create procurement events and publish RFPs"
              : "Read-only procurement visibility"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active events</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{events.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Briefs in review</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {events.filter((e) => e.status === "brief_submitted").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published RFPs</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {events.filter((e) =>
              e.status === "rfp_published" ||
              e.status === "evaluation_ready" ||
              e.status === "award_decided",
            ).length}
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Admin — Organization</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>Configure company profile, policy, and workspace settings.</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/org">Organization settings</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/users">Users & roles</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Admin — Procurement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Admins have full procurement access — create events, publish
                RFPs, and manage vendor evaluation like a manager.
              </p>
              <Button asChild size="sm">
                <Link to="/procurement">
                  <Plus className="size-4" />
                  Open procurement workspace
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>All procurement events — RFP ownership</CardTitle>
            <p className="text-sm text-muted-foreground">
              Who created each procurement request and current RFP status.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created by</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {event.createdBy?.name ?? "Unknown"}
                      {event.createdBy?.email && (
                        <p className="text-xs text-muted-foreground">
                          {event.createdBy.email}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatCreatorRole(event.createdBy?.role) || "—"}
                    </TableCell>
                    <TableCell>
                      <ProcurementStatusBadge status={event.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/procurement/${event.id}/chat`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Phase 1 — Manager workflow</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. New procurement → AI clarifying questions (interrupt)</p>
            <p>2. Structured brief → submit & approve</p>
            <p>3. Generate RFP → review interrupt → publish</p>
            <Button asChild>
              <Link to="/procurement">
                <Plus className="size-4" />
                Go to procurement workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Recent procurement events</h2>
        <div className="grid gap-3">
          {events.slice(0, 5).map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProcurementStatusBadge status={event.status} />
                    <span className="text-xs text-muted-foreground">
                      Created by {formatProcurementCreatorDetail(event)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/procurement/${event.id}/chat`}>
                      Open
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  {(event.rfpMarkdown || event.vendorProposals?.length) && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/procurement/${event.id}/vendors`}>Vendors</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageScroll>
  );
}
