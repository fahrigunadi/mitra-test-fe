import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import useAuthStore from "~/store/auth.store";

export default function AuthLayout() {
  const { isAuthenticated, fetchAuthenticatedUser, isLoading } = useAuthStore();

  useEffect(() => {
    fetchAuthenticatedUser();
  }, [fetchAuthenticatedUser]);

  // TODO: Add loader
  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="flex flex-col gap-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
