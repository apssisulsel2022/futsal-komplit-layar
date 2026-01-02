import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ClipboardList,
  Eye,
  Building2,
  UserPlus,
  CalendarPlus,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const stats = [
  { title: "Total Event", value: 24, icon: Calendar, trend: { value: 12, isPositive: true } },
  { title: "Total Wasit Terdaftar", value: 86, icon: Users, trend: { value: 8, isPositive: true } },
  { title: "Menunggu Persetujuan", value: 5, icon: Clock },
];

const quickActions = [
  { 
    title: "Persetujuan Event", 
    description: "5 event menunggu", 
    icon: FileCheck, 
    path: "/approvals",
    badge: 5,
    color: "bg-warning/10 text-warning"
  },
  { 
    title: "Monitoring Wasit", 
    description: "Pantau aktivitas wasit", 
    icon: Eye, 
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

const recentActivities = [
  {
    id: 1,
    type: "event_submitted",
    title: "Event baru diajukan",
    description: "Liga Futsal Gowa 2024 menunggu persetujuan",
    time: "10 menit lalu",
    icon: CalendarPlus,
    status: "pending",
  },
  {
    id: 2,
    type: "referee_registered",
    title: "Wasit baru terdaftar",
    description: "Andi Pratama mendaftar sebagai wasit",
    time: "1 jam lalu",
    icon: UserPlus,
    status: "info",
  },
  {
    id: 3,
    type: "event_approved",
    title: "Event disetujui",
    description: "Turnamen Antar Kabupaten telah disetujui",
    time: "2 jam lalu",
    icon: CheckCircle,
    status: "success",
  },
  {
    id: 4,
    type: "event_rejected",
    title: "Event ditolak",
    description: "Piala Wali Kota tidak memenuhi syarat",
    time: "3 jam lalu",
    icon: XCircle,
    status: "error",
  },
  {
    id: 5,
    type: "evaluation_completed",
    title: "Evaluasi selesai",
    description: "Evaluasi wasit Liga Makassar selesai",
    time: "5 jam lalu",
    icon: ClipboardList,
    status: "success",
  },
];

const getActivityStatus = (status: string) => {
  switch (status) {
    case "success":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "error":
      return "error" as const;
    default:
      return "info" as const;
  }
};

export default function Dashboard() {
  return (
    <AppLayout title="FFSS">
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-5 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status="primary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
              Admin Provinsi
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        </section>

        {/* Pending Approval Alert */}
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Perlu Perhatian</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ada 5 event yang menunggu persetujuan Anda.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/approvals">Lihat</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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
                      {action.badge && (
                        <span className="px-2 py-1 text-xs font-semibold bg-warning text-warning-foreground rounded-full">
                          {action.badge}
                        </span>
                      )}
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
                <Button variant="ghost" size="sm" className="text-primary">
                  Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                    index !== recentActivities.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    activity.status === "success" ? "bg-success/10" :
                    activity.status === "warning" || activity.status === "pending" ? "bg-warning/10" :
                    activity.status === "error" ? "bg-destructive/10" :
                    "bg-info/10"
                  }`}>
                    <activity.icon className={`h-4 w-4 ${
                      activity.status === "success" ? "text-success" :
                      activity.status === "warning" || activity.status === "pending" ? "text-warning" :
                      activity.status === "error" ? "text-destructive" :
                      "text-info"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <StatusBadge status={getActivityStatus(activity.status)} className="flex-shrink-0 text-[10px] px-1.5 py-0">
                        {activity.status === "success" ? "Selesai" :
                         activity.status === "pending" ? "Menunggu" :
                         activity.status === "error" ? "Ditolak" : "Info"}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Quick Stats - Desktop Only */}
        <section className="hidden md:block">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Event Bulan Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">8</p>
                    <p className="text-sm text-muted-foreground">Event berlangsung</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-success">+25%</p>
                    <p className="text-xs text-muted-foreground">vs bulan lalu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performa Wasit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-primary">4.6</p>
                    <p className="text-sm text-muted-foreground">Rating rata-rata</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-success">+0.2</p>
                    <p className="text-xs text-muted-foreground">vs bulan lalu</p>
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
