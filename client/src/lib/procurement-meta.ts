import type { ProcurementCreator, ProcurementEvent, UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  procurement_manager: "Procurement Manager",
  viewer: "Viewer",
};

export function formatCreatorRole(role?: UserRole): string {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role;
}

export function formatProcurementCreator(event: ProcurementEvent): string {
  if (!event.createdBy) return "Unknown";
  return event.createdBy.name;
}

export function formatProcurementCreatorDetail(event: ProcurementEvent): string {
  if (!event.createdBy) return "Creator not recorded";
  const role = formatCreatorRole(event.createdBy.role);
  const roleSuffix = role ? ` · ${role}` : "";
  return `${event.createdBy.name} (${event.createdBy.email})${roleSuffix}`;
}

export function userToProcurementCreator(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}): ProcurementCreator {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
