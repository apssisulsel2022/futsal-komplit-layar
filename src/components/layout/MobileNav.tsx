import { Home, Calendar, Users, ClipboardCheck, UserCog, Building2, UserCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingCount } from "@/hooks/useRegistrations";

export const MobileNav = () => {
  const { isAdminProvinsi, isAdmin } = useAuth();
  const { data: pendingCount } = usePendingCount();
  
  const navItems = [
    { icon: Home, label: "Beranda", path: "/dashboard" },
    { icon: Calendar, label: "Event", path: "/events" },
    { icon: Users, label: "Wasit", path: "/referees" },
    { icon: ClipboardCheck, label: "Evaluasi", path: "/evaluations" },
    ...(isAdminProvinsi() ? [
      { icon: Building2, label: "Organisasi", path: "/organization" },
      { icon: UserCog, label: "User", path: "/users" },
    ] : []),
    ...(isAdmin() ? [
      { icon: UserCheck, label: "Approval", path: "/user-approvals", badge: pendingCount },
    ] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] relative",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
            {'badge' in item && item.badge && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
