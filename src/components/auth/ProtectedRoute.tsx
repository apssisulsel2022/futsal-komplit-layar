import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: AppRole | AppRole[];
  requireProfileComplete?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireRole,
  requireProfileComplete = false,
  requireAdmin = false
}: ProtectedRouteProps) {
  const { user, isLoading, role, isProfileComplete, isAdmin } = useAuth();
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

  // Check if user has no role assigned (admin hasn't assigned yet)
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Menunggu Persetujuan
          </h2>
          <p className="text-muted-foreground">
            Akun Anda sedang menunggu persetujuan dari admin.
          </p>
        </div>
      </div>
    );
  }

  // Check if profile completion is required but not complete
  if (requireProfileComplete && !isProfileComplete) {
    // Allow access to profile completion page
    if (location.pathname !== "/referee/profile/complete") {
      return <Navigate to="/referee/profile/complete" replace />;
    }
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    // Redirect based on actual role
    if (role === "wasit") {
      return <Navigate to="/referee" replace />;
    } else if (role === "evaluator") {
      return <Navigate to="/evaluations" replace />;
    } else if (role === "panitia") {
      return <Navigate to="/events" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Check specific role requirement
  if (requireRole) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!allowedRoles.includes(role)) {
      // Redirect based on actual role
      if (isAdmin()) {
        return <Navigate to="/dashboard" replace />;
      } else if (role === "wasit") {
        return <Navigate to="/referee" replace />;
      } else if (role === "evaluator") {
        return <Navigate to="/evaluations" replace />;
      } else if (role === "panitia") {
        return <Navigate to="/events" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
