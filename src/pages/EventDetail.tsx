import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Edit, UserPlus, CheckCircle, XCircle, Clock, Loader2, History, User } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEvent, useEventApprovals, useApproveEvent, useRejectEvent, useCompleteEvent, getEventStatusDisplay, EventStatus } from "@/hooks/useEvents";
import { useEventAssignments, getRoleBadgeVariant, getStatusBadgeVariant, RefereeRole, AssignmentStatus } from "@/hooks/useEventAssignments";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function EventDetail() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAdminProvinsi } = useAuth();
  
  const { data: event, isLoading } = useEvent(eventId || "");
  const { data: approvals } = useEventApprovals(eventId || "");
  const { data: assignments, isLoading: assignmentsLoading } = useEventAssignments(eventId || "");
  const approveEvent = useApproveEvent();
  const rejectEvent = useRejectEvent();
  const completeEvent = useCompleteEvent();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <AppLayout title="Detail Event">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout title="Detail Event">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Event tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate("/events")}>
            Kembali ke Daftar Event
          </Button>
        </div>
      </AppLayout>
    );
  }

  const statusDisplay = getEventStatusDisplay(event.status as EventStatus);
  const canApprove = isAdminProvinsi() && event.status === "DIAJUKAN";
  const canComplete = isAdminProvinsi() && event.status === "DISETUJUI";
  const canAssignReferees = event.status === "DISETUJUI";

  const handleApprove = async () => {
    if (!user) return;
    await approveEvent.mutateAsync({ eventId: event.id, notes, userId: user.id });
    setShowApproveDialog(false);
    setNotes("");
  };

  const handleReject = async () => {
    if (!user || !notes.trim()) return;
    await rejectEvent.mutateAsync({ eventId: event.id, notes, userId: user.id });
    setShowRejectDialog(false);
    setNotes("");
  };

  const handleComplete = async () => {
    if (!user) return;
    await completeEvent.mutateAsync({ eventId: event.id, notes, userId: user.id });
    setShowCompleteDialog(false);
    setNotes("");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "UTAMA": return "Wasit Utama";
      case "CADANGAN": return "Wasit Cadangan";
      default: return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "confirmed": return "Dikonfirmasi";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <AppLayout title="Detail Event">
      <div className="animate-fade-in">
        {/* Back Button */}
        <div className="p-4 pb-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Link>
          </Button>
        </div>

        {/* Event Header */}
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{event.name}</h1>
              <StatusBadge status={statusDisplay.variant}>
                {statusDisplay.label}
              </StatusBadge>
            </div>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.date), "d MMMM yyyy", { locale: id })}
            </span>
            {event.location && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            )}
          </div>

          {event.kabupaten_kota && (
            <p className="text-sm text-muted-foreground">
              Wilayah: {event.kabupaten_kota.name}
            </p>
          )}

          {/* Action Buttons */}
          {(canApprove || canComplete) && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Aksi Admin</p>
                <div className="flex flex-wrap gap-2">
                  {canApprove && (
                    <>
                      <Button size="sm" onClick={() => setShowApproveDialog(true)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Setujui
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setShowRejectDialog(true)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Tolak
                      </Button>
                    </>
                  )}
                  {canComplete && (
                    <Button size="sm" variant="secondary" onClick={() => setShowCompleteDialog(true)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Tandai Selesai
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assign Referees CTA */}
          {canAssignReferees && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Penugasan Wasit</p>
                    <p className="text-xs text-muted-foreground">Event sudah disetujui, silakan tugaskan wasit</p>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={`/events/${event.id}/assign-referees`}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Tugaskan
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!canAssignReferees && event.status !== "DISETUJUI" && event.status !== "SELESAI" && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Penugasan wasit hanya dapat dilakukan setelah event disetujui
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="px-4 pb-8">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="referees">
              Wasit
              {assignments && assignments.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {assignments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4 space-y-3">
            {approvals && approvals.length > 0 ? (
              approvals.map((approval) => (
                <Card key={approval.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        approval.action === "APPROVE" ? "bg-green-100 text-green-600" :
                        approval.action === "REJECT" ? "bg-red-100 text-red-600" :
                        approval.action === "COMPLETE" ? "bg-blue-100 text-blue-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {approval.action === "APPROVE" ? <CheckCircle className="h-4 w-4" /> :
                         approval.action === "REJECT" ? <XCircle className="h-4 w-4" /> :
                         approval.action === "COMPLETE" ? <CheckCircle className="h-4 w-4" /> :
                         <History className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {approval.action === "SUBMIT" ? "Event Diajukan" :
                           approval.action === "APPROVE" ? "Event Disetujui" :
                           approval.action === "REJECT" ? "Event Ditolak" :
                           approval.action === "COMPLETE" ? "Event Selesai" :
                           approval.action}
                        </p>
                        {approval.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{approval.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {approval.approver && <span>Oleh: {approval.approver.full_name}</span>}
                          <span>•</span>
                          <span>{format(new Date(approval.created_at), "d MMM yyyy HH:mm", { locale: id })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Belum ada riwayat
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="referees" className="mt-4 space-y-3">
            {canAssignReferees && (
              <div className="flex justify-end mb-2">
                <Button size="sm" asChild>
                  <Link to={`/events/${event.id}/assign-referees`}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Tambah Wasit
                  </Link>
                </Button>
              </div>
            )}
            
            {assignmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : assignments && assignments.length > 0 ? (
              assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{assignment.referee?.full_name || "Unknown"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={getRoleBadgeVariant(assignment.role as RefereeRole)}>
                            {getRoleLabel(assignment.role || "CADANGAN")}
                          </StatusBadge>
                          <StatusBadge status={getStatusBadgeVariant(assignment.status as AssignmentStatus)}>
                            {getStatusLabel(assignment.status || "pending")}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Belum ada wasit yang ditugaskan
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Event</DialogTitle>
            <DialogDescription>
              Event yang disetujui dapat ditugaskan wasit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Batal</Button>
            <Button onClick={handleApprove} disabled={approveEvent.isPending}>
              {approveEvent.isPending ? "Menyetujui..." : "Setujui Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Event</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alasan Penolakan *</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jelaskan alasan penolakan..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectEvent.isPending || !notes.trim()}>
              {rejectEvent.isPending ? "Menolak..." : "Tolak Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selesaikan Event</DialogTitle>
            <DialogDescription>
              Tandai event sebagai selesai
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Batal</Button>
            <Button onClick={handleComplete} disabled={completeEvent.isPending}>
              {completeEvent.isPending ? "Menyimpan..." : "Tandai Selesai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
