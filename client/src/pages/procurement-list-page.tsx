import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProcurementStatusBadge } from "@/components/procurement/status-badge";
import { PageScroll } from "@/components/layout/page-scroll";
import { Can } from "@casl/react";
import { createProcurement } from "@/features/procurement/procurementSlice";
import {
  formatCreatorRole,
  userToProcurementCreator,
} from "@/lib/procurement-meta";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function ProcurementListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const events = useAppSelector((s) => s.procurement.events);
  const user = useAppSelector((s) => s.auth.user);
  const [title, setTitle] = useState("");
  const [requirement, setRequirement] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    const id = crypto.randomUUID();
    dispatch(
      createProcurement({
        id,
        title: title.trim(),
        requirement: requirement.trim() || undefined,
        createdBy: user ? userToProcurementCreator(user) : undefined,
      }),
    );
    setTitle("");
    setRequirement("");
    navigate(`/procurement/${id}/chat`);
  };

  return (
    <PageScroll className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Procurement</h1>
          <p className="text-muted-foreground">
            Create events, choose an RFP template, and open the AI chat workspace.
          </p>
        </div>
      </div>

      <Can I="create" a="Procurement">
        <Card>
          <CardHeader>
            <CardTitle>New procurement request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Cloud migration to AWS"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirement">Initial requirement (optional)</Label>
              <Textarea
                id="requirement"
                placeholder="Freeform requirement for the AI intake agent..."
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              Create & open chat
            </Button>
          </CardContent>
        </Card>
      </Can>

      {user?.role === "viewer" && (
        <Card className="border-muted">
          <CardContent className="py-4 text-sm text-muted-foreground">
            You are signed in as <strong>Viewer</strong> (read-only). To create a
            new RFP, sign in as Procurement Manager:{" "}
            <strong>pm@procure.ai</strong> / <strong>pm123</strong>, then use the
            <strong> New procurement request</strong> form above this table.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="text-sm">
                    <p>{event.createdBy?.name ?? "Unknown"}</p>
                    {event.createdBy && (
                      <p className="text-xs text-muted-foreground">
                        {formatCreatorRole(event.createdBy.role)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProcurementStatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(event.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/procurement/${event.id}/chat`}>Open chat</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageScroll>
  );
}
