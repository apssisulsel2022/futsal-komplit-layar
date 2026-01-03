import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  User,
  Trophy,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Calendar,
  Bell,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useHonorStats, useHonors } from "@/hooks/useHonors";
import { useEvents } from "@/hooks/useEvents";
import { useState } from "react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getHonorStatusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <StatusBadge status="success">Terverifikasi</StatusBadge>;
    case "submitted":
      return <StatusBadge status="warning">Menunggu</StatusBadge>;
    case "draft":
      return <StatusBadge status="neutral">Draft</StatusBadge>;
    default:
      return <StatusBadge status="neutral">{status}</StatusBadge>;
  }
};

const getLicenseLabel = (level: string | null) => {
  if (!level) return "Belum ada lisensi";
  const labels: Record<string, string> = {
    level_1: "Lisensi Level 1",
    level_2: "Lisensi Level 2", 
    level_3: "Lisensi Level 3",
  };
  return labels[level] || level;
};

export default function RefereeDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("active");
  
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: honorStats } = useHonorStats();
  const { data: honors } = useHonors();
  const { data: events } = useEvents();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
    { icon: CalendarDays, label: "Event", path: "/referee/events" },
    { icon: Wallet, label: "Honor", path: "/referee/honor" },
    { icon: User, label: "Profil", path: "/referee/profile" },
  ];

  // Get completed honors
  const completedHonors = honors?.filter(h => h.status === "verified") || [];
  const pendingHonors = honors?.filter(h => h.status === "submitted") || [];
  
  const pendingAmount = pendingHonors.reduce((sum, h) => sum + h.amount, 0);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary-foreground/30">
              <AvatarImage src={profile?.profile_photo_url || ""} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold">
                {profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm opacity-80">Selamat datang,</p>
              <h1 className="font-bold text-lg">{profile?.full_name || "Wasit"}</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status="primary">{getLicenseLabel(profile?.license_level || null)}</StatusBadge>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-8 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-md">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{honors?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Event Ditangani
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <p className="text-lg font-bold">
                {honorStats?.total_earned ? formatCurrency(honorStats.total_earned).replace("Rp", "").trim() : "0"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Total Honor
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-4 w-4 text-info" />
              </div>
              <p className="text-lg font-bold text-success">
                {completedHonors.length > 0 ? "Verified" : "-"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Status Terakhir
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Honor Alert */}
        {pendingAmount > 0 && (
          <Link to="/referee/honor">
            <Card className="bg-warning/10 border-warning/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Honor Menunggu</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(pendingAmount)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Event List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Riwayat Honor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="active">
                    Menunggu ({pendingHonors.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Selesai ({completedHonors.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="mt-0 p-4 pt-3 space-y-3">
                {pendingHonors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada honor menunggu</p>
                  </div>
                ) : (
                  pendingHonors.map((honor) => (
                    <Card key={honor.id} className="border-l-4 border-l-warning">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">
                              {honor.events?.name || "Event tidak ditemukan"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {honor.notes || "Tidak ada catatan"}
                            </p>
                          </div>
                          {getHonorStatusBadge(honor.status)}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {honor.events?.date || "-"}
                          </span>
                          <span className="font-semibold text-sm text-warning">
                            {formatCurrency(honor.amount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0 p-4 pt-3 space-y-3">
                {completedHonors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Belum ada honor terverifikasi</p>
                  </div>
                ) : (
                  completedHonors.map((honor) => (
                    <Card key={honor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">
                              {honor.events?.name || "Event tidak ditemukan"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {honor.events?.date || "-"}
                            </p>
                          </div>
                          {getHonorStatusBadge(honor.status)}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            Honor
                          </span>
                          <span className="font-semibold text-sm text-success">
                            {formatCurrency(honor.amount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
