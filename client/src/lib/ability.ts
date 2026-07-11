import {
  AbilityBuilder,
  createMongoAbility,
  type InferSubjects,
  type MongoAbility,
} from "@casl/ability";
import type { UserRole } from "@/types";

export type Actions =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "publish"
  | "approve"
  | "submit";

/** Entity map for CASL `InferSubjects` — drives typed subject checks in the UI. */
type EntityMap = {
  Org: { id: string };
  User: { id: string };
  Procurement: { id: string; status?: string };
  RFP: { id: string };
  Brief: { id: string };
  Dashboard: Record<string, never>;
};

export type Subjects = InferSubjects<EntityMap> | "all";

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function defineAbilityFor(role: UserRole): AppAbility {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (role === "admin") {
    can("manage", "all");
    return build() as AppAbility;
  }

  if (role === "procurement_manager") {
    can("read", "Dashboard");
    can(["create", "read", "update"], "Procurement");
    can(["create", "read", "update", "submit", "approve"], "Brief");
    can(["create", "read", "update", "publish"], "RFP");
    return build() as AppAbility;
  }

  can("read", "Dashboard");
  can("read", "Procurement");
  can("read", "RFP");
  can("read", "Brief");

  return build() as AppAbility;
}
