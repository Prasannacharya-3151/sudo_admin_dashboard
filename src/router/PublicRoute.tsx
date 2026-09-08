import { Navigate, Outlet } from "react-router-dom";
import { useSudoAuth } from "../context/SudoAuthContext";

export default function PublicRoute() {
  const { isAuthenticated, isLoading } = useSudoAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7E49F2]/20 border-t-[#7E49F2]" />

          <p className="text-sm text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/sudo/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}