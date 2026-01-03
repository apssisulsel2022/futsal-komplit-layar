import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ClipboardList,
  Building2,
  UserPlus,
  CalendarPlus,
  FileCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardSummary, formatCurrency } from "@/hooks/useReports";
import { useAuditLogs, getActionLabel, getActionVariant } from "@/hooks/useAuditLogs";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Dashboard() {
  const { role, kabupatenKotaId, isAdminProvinsi } = useAuth();
  
  // Apply regional filter for admin kab/kota
  const filters = isAdminProvinsi() ? {} : { kabupatenKotaId };
  
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(filters);
  const { data: auditLogs, isLoading: logsLoading } = useAuditLogs({ limit: 5 });

  const stats = [
    { 
      title: "Total Event", 
      value: summary?.total_events || 0, 
      icon: Calendar,
      trend: summary?.completed_events ? { 
        value: Math.round((summary.completed_events / (summary.total_events || 1)) * 100), 
        isPositive: true 
      } : undefined
    },
    { 
      title: "Total Wasit Terdaftar", 
      value: summary?.total_referees || 0, 
      icon: Users,
      trend: summary?.active_referees ? { 
        value: Math.round((summary.active_referees / (summary.total_referees || 1)) * 100), 
        isPositive: true 
      } : undefined
    },
    { 
      title: "Event Selesai", 
      value: summary?.completed_events || 0, 
      icon: CheckCircle
    },
  ];

  const quickActions = [
    { 
      title: "Persetujuan Event", 
      description: "Review pengajuan event", 
      icon: FileCheck, 
      path: "/approvals",
      color: "bg-warning/10 text-warning"
    },
    { 
      title: "Monitoring Wasit", 
      description: "Pantau aktivitas wasit", 
      icon: Users, 
      path: "/referees",
      color: "bg-info/10 text-info"
    },
    { 
      title: "Struktur Organisasi", 
      description: "Kelola pengurus", 
      icon: Building2, 
      path: "/organization",
      color: "bg-primary/10 text-primary"
    },
  ];

  const getActivityIcon = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VERIFIED")) return CheckCircle;
    if (action.includes("REJECT")) return XCircle;
    if (action.includes("SUBMIT")) return CalendarPlus;
    if (action.includes("ASSIGN")) return UserPlus;
    return ClipboardList;
  };

  const getActivityStatus = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VERIFIED") || action.includes("COMPLETE")) return "success";
    if (action.includes("REJECT")) return "error";
    if (action.includes("SUBMIT") || action.includes("PENDING")) return "warning";
    return "info";
  };

  const roleLabel = role === "admin_provinsi" ? "Admin Provinsi" : 
                   role === "admin_kab_kota" ? "Admin Kab/Kota" : "Admin";

  return (
    <AppLayout title="FFSS">
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status="primary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
              {roleLabel}
            </StatusBadge>
          </div>
          <h2 className="text-xl font-bold mb-1">Selamat Datang, Admin!</h2>
          <p className="text-sm text-primary-foreground/80">
            Kelola dan pantau seluruh aktivitas futsal di Sulawesi Selatan.
          </p>
        </div>

        {/* Stats Summary */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Ringkasan
          </h3>
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>
          )}
        </section>

        {/* Income Summary */}
        {summary && (summary.total_verified_income > 0 || summary.total_pending_income > 0) && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Ringkasan Honor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Honor Terverifikasi</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(summary.total_verified_income)}</p>
                </CardContent>
              </Card>
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Honor Pending</p>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(summary.total_pending_income)}</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Akses Cepat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.path}>
                <Card className="hover:shadow-md transition-all hover:border-primary/30 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-xl ${action.color}`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <h4 className="font-semibold mt-3 mb-1">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary" asChild>
                  <Link to="/audit-logs">
                    Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log, index) => {
                  const ActivityIcon = getActivityIcon(log.action);
                  const status = getActivityStatus(log.action);
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                        index !== auditLogs.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        status === "success" ? "bg-success/10" :
                        status === "warning" ? "bg-warning/10" :
                        status === "error" ? "bg-destructive/10" :
                        "bg-info/10"
                      }`}>
                        <ActivityIcon className={`h-4 w-4 ${
                          status === "success" ? "text-success" :
                          status === "warning" ? "text-warning" :
                          status === "error" ? "text-destructive" :
                          "text-info"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{getActionLabel(log.action as any)}</p>
                          <StatusBadge 
                            status={status === "success" ? "success" : status === "warning" ? "warning" : status === "error" ? "error" : "info"} 
                            className="flex-shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {status === "success" ? "Selesai" :
                             status === "warning" ? "Menunggu" :
                             status === "error" ? "Ditolak" : "Info"}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.entity_type} - {log.actor_name || "System"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada aktivitas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Quick Stats - Desktop Only */}
        <section className="hidden md:block">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Wasit Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">{summary?.active_referees || 0}</p>
                    <p className="text-sm text-muted-foreground">dari {summary?.total_referees || 0} total</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-success">
                      {summary?.total_referees ? Math.round((summary.active_referees / summary.total_referees) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">aktif</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rata-rata Honor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(summary?.avg_income_per_referee || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">per wasit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
