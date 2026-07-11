import type { User, ProcurementEvent } from "@/types";

export const DEMO_CREDENTIALS = [
  {
    email: "admin@procure.ai",
    password: "admin123",
    label: "Admin",
  },
  {
    email: "pm@procure.ai",
    password: "pm123",
    label: "Procurement Manager",
  },
  {
    email: "viewer@procure.ai",
    password: "viewer123",
    label: "Viewer",
  },
] as const;

export const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: "user-admin",
    email: "admin@procure.ai",
    password: "admin123",
    name: "Asha Admin",
    role: "admin",
    organizationId: "org-1",
  },
  {
    id: "user-pm",
    email: "pm@procure.ai",
    password: "pm123",
    name: "Ashish Gupta",
    role: "procurement_manager",
    organizationId: "org-1",
  },
  {
    id: "user-viewer",
    email: "viewer@procure.ai",
    password: "viewer123",
    name: "Rajesh Kumar",
    role: "viewer",
    organizationId: "org-1",
  },
];

export const SEED_PROCUREMENTS: ProcurementEvent[] = [
  {
    id: "proc-1",
    title: "Cloud migration to AWS",
    status: "brief_submitted",
    requirement: "Migrate legacy apps to AWS over 3 months, budget $150k",
    briefMarkdown: "## Procurement brief\nScope: AWS migration...",
    createdBy: {
      userId: "user-pm",
      name: "Ashish Gupta",
      email: "pm@procure.ai",
      role: "procurement_manager",
    },
    createdAt: "2026-06-20T10:00:00.000Z",
    updatedAt: "2026-06-22T14:30:00.000Z",
  },
  {
    id: "proc-2",
    title: "Office ergonomics refresh",
    status: "draft",
    requirement: "200 ergonomic chairs for Bangalore office",
    createdBy: {
      userId: "user-admin",
      name: "Asha Admin",
      email: "admin@procure.ai",
      role: "admin",
    },
    createdAt: "2026-06-23T09:00:00.000Z",
    updatedAt: "2026-06-23T09:00:00.000Z",
  },
];
