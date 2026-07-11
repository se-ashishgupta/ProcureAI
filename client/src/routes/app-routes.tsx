import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/routes/protected-route";
import { LoginPage } from "@/pages/login-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ProcurementListPage } from "@/pages/procurement-list-page";
import { ProcurementChatPage } from "@/pages/procurement-chat-page";
import { ProcurementVendorsPage } from "@/pages/procurement-vendors-page";
import { VendorProposalChatPage } from "@/pages/vendor-proposal-chat-page";
import { AdminOrgPage, AdminUsersPage } from "@/pages/admin-pages";
import { AdminRoute } from "@/routes/admin-route";
import { useAppSelector } from "@/store/hooks";

function RootRedirect() {
  const user = useAppSelector((s) => s.auth.user);
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/procurement" element={<ProcurementListPage />} />
            <Route path="/procurement/:id/chat" element={<ProcurementChatPage />} />
            <Route path="/procurement/:id/vendors" element={<ProcurementVendorsPage />} />
            <Route
              path="/procurement/:id/vendors/:proposalId/chat"
              element={<VendorProposalChatPage />}
            />
            <Route element={<AdminRoute />}>
              <Route path="/admin/org" element={<AdminOrgPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
