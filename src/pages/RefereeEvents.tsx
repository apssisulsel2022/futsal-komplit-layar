import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
  Wallet,
  User,
  Loader2,
  Calendar,
  Trophy,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  useUpcomingRefereeEvents, 
  usePastRefereeEvents, 
  usePendingAssignments,
  RefereeEventAssignment 
} from "@/hooks/useRefereeEvents";
import { useConfirmAssignment } from "@/hooks/useEventAssignments";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const getRoleBadgeVariant = (role: string) => {
  return role === "UTAMA" ? "primary" : "info";
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Menunggu Konfirmasi";
    case "confirmed":
      return "Dikonfirmasi";
    case "declined":
      return "Ditolak";
    default:
      return status;
  }
};

const getHonorStatusLabel = (status: string | undefined) => {
  if (!status) return null;
  switch (status) {
    case "draft":
      return { label: "Honor: Draft", variant: "neutral" as const };
    case "submitted":
      return { label: "Honor: Menunggu", variant: "warning" as const };
    case "verified":
      return { label: "Honor: Terverifikasi", variant: "success" as const };
    case "rejected":
      return { label: "Honor: Ditolak", variant: "error" as const };
    default:
      return null;
  }
};

export default function RefereeEvents() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    assignment: RefereeEventAssignment | null;
    action: "confirm" | "decline";
  }>({ open: false, assignment: null, action: "confirm" });

  const { data: upcomingEvents, isLoading: upcomingLoading } = useUpcomingRefereeEvents();
  const { data: pastEvents, isLoading: pastLoading } = usePastRefereeEvents();
  const { data: pendingAssignments } = usePendingAssignments();
  const confirmAssignment = useConfirmAssignment();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
    { icon: CalendarDays, label: "Event", path: "/referee/events" },
    { icon: Wallet, label: "Honor", path: "/referee/honor" },
    { icon: User, label: "Profil", path: "/referee/profile" },
  ];

  const handleConfirmAction = async () => {
    if (!confirmDialog.assignment) return;

    await confirmAssignment.mutateAsync({
      assignmentId: confirmDialog.assignment.id,
      confirm: confirmDialog.action === "confirm",
    });

    setConfirmDialog({ open: false, assignment: null, action: "confirm" });
  };

  const openConfirmDialog = (assignment: RefereeEventAssignment, action: "confirm" | "decline") => {
    setConfirmDialog({ open: true, assignment, action });
  };

  const isLoading = upcomingLoading || pastLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const EventCard = ({ assignment, showActions = false }: { assignment: RefereeEventAssignment; showActions?: boolean }) => {
    const event = assignment.event;
    if (!event) return null;

    const isPastEvent = new Date(event.date) < new Date() || event.status === "SELESAI";
    const honorStatus = getHonorStatusLabel(assignment.honor?.status);
    const needsHonorSubmission = isPastEvent && !assignment.honor && assignment.status === "confirmed";

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{event.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.category || "Futsal"}
              </p>
            </div>
            <StatusBadge status={getRoleBadgeVariant(assignment.role)}>
              {assignment.role}
            </StatusBadge>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(event.date), "EEEE, dd MMMM yyyy", { locale: id })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{event.location || event.kabupaten_kota?.name || "Lokasi belum ditentukan"}</span>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex flex-wrap gap-2 mt-3">
            {assignment.status === "pending" && (
              <StatusBadge status="warning">
                <Clock className="h-3 w-3 mr-1" />
                {getStatusLabel(assignment.status)}
              </StatusBadge>
            )}
            {assignment.status === "confirmed" && (
              <StatusBadge status="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {getStatusLabel(assignment.status)}
              </StatusBadge>
            )}
            {assignment.status === "declined" && (
              <StatusBadge status="error">
                <XCircle className="h-3 w-3 mr-1" />
                {getStatusLabel(assignment.status)}
              </StatusBadge>
            )}
            {honorStatus && (
              <StatusBadge status={honorStatus.variant}>
                {honorStatus.label}
              </StatusBadge>
            )}
          </div>

          {/* Actions */}
          {showActions && assignment.status === "pending" && (
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => openConfirmDialog(assignment, "decline")}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Tolak
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => openConfirmDialog(assignment, "confirm")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Konfirmasi
              </Button>
            </div>
          )}

          {/* Submit Honor Button for completed events */}
          {needsHonorSubmission && (
            <div className="mt-4 pt-3 border-t">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => navigate("/referee/honor")}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Honor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-accent px-4 pt-12 pb-6">
        <h1 className="text-xl font-bold text-primary-foreground mb-1">Event Saya</h1>
        <p className="text-sm text-primary-foreground/80">Daftar event yang ditugaskan kepada Anda</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 animate-fade-in">
        {/* Pending Assignment Alert */}
        {pendingAssignments && pendingAssignments.length > 0 && (
          <Alert className="bg-warning/10 border-warning/30">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm text-warning">
              Anda memiliki {pendingAssignments.length} penugasan yang menunggu konfirmasi
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upcoming" className="gap-1">
              <CalendarDays className="h-4 w-4" />
              Akan Datang ({upcomingEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <Trophy className="h-4 w-4" />
              Riwayat ({pastEvents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Tidak ada event mendatang</p>
                  <p className="text-sm">Event yang ditugaskan akan muncul di sini</p>
                </CardContent>
              </Card>
            ) : (
              upcomingEvents.map((assignment) => (
                <EventCard key={assignment.id} assignment={assignment} showActions />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {!pastEvents || pastEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Belum ada riwayat event</p>
                  <p className="text-sm">Event yang telah selesai akan muncul di sini</p>
                </CardContent>
              </Card>
            ) : (
              pastEvents.map((assignment) => (
                <EventCard key={assignment.id} assignment={assignment} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "confirm" ? "Konfirmasi Penugasan" : "Tolak Penugasan"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "confirm" 
                ? `Anda akan mengkonfirmasi kehadiran untuk event "${confirmDialog.assignment?.event?.name}". Pastikan Anda dapat hadir pada tanggal yang ditentukan.`
                : `Anda akan menolak penugasan untuk event "${confirmDialog.assignment?.event?.name}". Admin akan mencari wasit pengganti.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            >
              Batal
            </Button>
            <Button 
              variant={confirmDialog.action === "confirm" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={confirmAssignment.isPending}
            >
              {confirmAssignment.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {confirmDialog.action === "confirm" ? "Ya, Konfirmasi" : "Ya, Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
