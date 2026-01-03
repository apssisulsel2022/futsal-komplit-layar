import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin" | "referee";
  requireProfileComplete?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireRole,
  requireProfileComplete = false 
}: ProtectedRouteProps) {
  const { user, isLoading, role, isProfileComplete } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if profile completion is required but not complete
  if (requireProfileComplete && !isProfileComplete) {
    // Allow access to profile completion page
    if (location.pathname !== "/referee/profile/complete") {
      return <Navigate to="/referee/profile/complete" replace />;
    }
  }

  // Check role requirement
  if (requireRole && role !== requireRole) {
    // Redirect based on actual role
    if (role === "admin") {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/referee" replace />;
    }
  }

  return <>{children}</>;
}
