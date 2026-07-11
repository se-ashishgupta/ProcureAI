import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { MOCK_USERS } from "@/lib/mock-data";
import type { OrgSettings, User, UserRole } from "@/types";

const ORG_KEY = "procure_org";
const USERS_KEY = "procure_org_users";
const CUSTOM_CREDS_KEY = "procure_custom_credentials";

export interface CustomCredential {
  email: string;
  password: string;
}

function loadOrg(): OrgSettings {
  const raw = localStorage.getItem(ORG_KEY);
  if (raw) return JSON.parse(raw) as OrgSettings;
  const defaultOrg: OrgSettings = {
    id: "org-1",
    name: "ProcureAI Demo Corp",
    industry: "Technology",
    website: "https://procure.ai",
    policySummary:
      "Purchases above $50,000 require procurement manager approval. Vendor onboarding requires security review.",
    logoLabel: "PA",
  };
  localStorage.setItem(ORG_KEY, JSON.stringify(defaultOrg));
  return defaultOrg;
}

function loadUsers(): User[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (raw) return JSON.parse(raw) as User[];
  const seed = MOCK_USERS.map(({ password: _, ...user }) => user);
  localStorage.setItem(USERS_KEY, JSON.stringify(seed));
  return seed;
}

function loadCustomCredentials(): CustomCredential[] {
  const raw = localStorage.getItem(CUSTOM_CREDS_KEY);
  return raw ? (JSON.parse(raw) as CustomCredential[]) : [];
}

function persistOrg(org: OrgSettings) {
  localStorage.setItem(ORG_KEY, JSON.stringify(org));
}

function persistUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function persistCustomCredentials(creds: CustomCredential[]) {
  localStorage.setItem(CUSTOM_CREDS_KEY, JSON.stringify(creds));
}

/** Resolve roster + demo passwords for login. */
export function getAuthDirectory(): Array<User & { password: string }> {
  const roster = loadUsers();
  const customCreds = loadCustomCredentials();
  const demoByEmail = new Map(
    MOCK_USERS.map((u) => [u.email.toLowerCase(), u]),
  );

  return roster
    .map((user) => {
      const demo = demoByEmail.get(user.email.toLowerCase());
      const custom = customCreds.find(
        (c) => c.email.toLowerCase() === user.email.toLowerCase(),
      );
      const password = custom?.password ?? demo?.password ?? "";
      return { ...user, password };
    })
    .filter((user) => user.password.length > 0);
}

interface AdminState {
  org: OrgSettings;
  users: User[];
}

const initialState: AdminState = {
  org: loadOrg(),
  users: loadUsers(),
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    updateOrg: (state, action: PayloadAction<Partial<OrgSettings>>) => {
      state.org = { ...state.org, ...action.payload };
      persistOrg(state.org);
    },
    setUserRole: (
      state,
      action: PayloadAction<{ userId: string; role: UserRole }>,
    ) => {
      const user = state.users.find((u) => u.id === action.payload.userId);
      if (!user) return;
      user.role = action.payload.role;
      persistUsers(state.users);
    },
    addOrgUser: (
      state,
      action: PayloadAction<{
        name: string;
        email: string;
        role: UserRole;
        password: string;
      }>,
    ) => {
      const email = action.payload.email.trim().toLowerCase();
      if (state.users.some((u) => u.email.toLowerCase() === email)) return;

      const user: User = {
        id: crypto.randomUUID(),
        email: action.payload.email.trim(),
        name: action.payload.name.trim(),
        role: action.payload.role,
        organizationId: state.org.id,
      };
      state.users.push(user);
      persistUsers(state.users);

      const creds = loadCustomCredentials();
      creds.push({ email: user.email, password: action.payload.password });
      persistCustomCredentials(creds);
    },
    removeOrgUser: (state, action: PayloadAction<string>) => {
      const user = state.users.find((u) => u.id === action.payload);
      if (!user || user.id === "user-admin") return;

      const adminCount = state.users.filter((u) => u.role === "admin").length;
      if (user.role === "admin" && adminCount <= 1) return;

      state.users = state.users.filter((u) => u.id !== action.payload);
      persistUsers(state.users);

      const creds = loadCustomCredentials().filter(
        (c) => c.email.toLowerCase() !== user.email.toLowerCase(),
      );
      persistCustomCredentials(creds);
    },
    hydrateAdmin: (state) => {
      state.org = loadOrg();
      state.users = loadUsers();
    },
  },
});

export const { updateOrg, setUserRole, addOrgUser, removeOrgUser, hydrateAdmin } =
  adminSlice.actions;

export default adminSlice.reducer;
