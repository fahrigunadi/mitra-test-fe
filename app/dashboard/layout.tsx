import { AppContent } from "~/components/app-content";
import { AppShell } from "~/components/app-shell";
import { AppSidebar } from "~/components/app-sidebar";
import { Navigate, Outlet } from "react-router";
import useAuthStore from "~/store/auth.store";
import { useEffect } from "react";

export default function DashboardLayout() {
  const { isAuthenticated, fetchAuthenticatedUser, isLoading } = useAuthStore();

  useEffect(() => {
    fetchAuthenticatedUser();
  }, [fetchAuthenticatedUser]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell variant="sidebar" >
      <AppSidebar />
      <AppContent variant="sidebar" className="overflow-x-hidden">
        <Outlet />
      </AppContent>
    </AppShell>
  );
}
