import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { user, isLoading, role, isProfileComplete, isAdmin, registrationStatus, signOut } = useAuth();
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

  // Check if user registration is pending
  if (registrationStatus === "pending") {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check if user registration was rejected
  if (registrationStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Pendaftaran Ditolak
          </h2>
          <p className="text-muted-foreground mb-6">
            Maaf, pendaftaran Anda telah ditolak oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.
          </p>
          <Button onClick={() => signOut()} variant="outline">
            Keluar
          </Button>
        </div>
      </div>
    );
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
  // Applies to all roles
  if (requireProfileComplete && !isProfileComplete) {
    // Allow access to profile completion pages
    const profileCompletePaths = ["/profile/complete", "/referee/profile/complete"];
    if (!profileCompletePaths.includes(location.pathname)) {
      return <Navigate to="/profile/complete" replace />;
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
