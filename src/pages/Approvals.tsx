import { useState } from "react";
import { Search, Calendar, MapPin, CheckCircle, XCircle, Clock, Users, FileText, ChevronRight, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEvents, useApproveEvent, useRejectEvent, Event } from "@/hooks/useEvents";
import { useKabupatenKota } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Approvals() {
  const { toast } = useToast();
  const { user, kabupatenKotaId, isAdminProvinsi } = useAuth();
  
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKabKota, setFilterKabKota] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  // Apply regional filter for admin kab/kota
  const regionalFilter = isAdminProvinsi() ? undefined : kabupatenKotaId || undefined;
  
  const { data: pendingEvents, isLoading: pendingLoading } = useEvents({ 
    status: "DIAJUKAN",
    kabupatenKotaId: regionalFilter
  });
  const { data: approvedEvents, isLoading: approvedLoading } = useEvents({ 
    status: "DISETUJUI",
    kabupatenKotaId: regionalFilter
  });
  const { data: rejectedEvents, isLoading: rejectedLoading } = useEvents({ 
    status: "DITOLAK",
    kabupatenKotaId: regionalFilter
  });
  
  const { data: kabupatenKotaList } = useKabupatenKota();
  const approveEvent = useApproveEvent();
  const rejectEvent = useRejectEvent();

  const filteredPendingEvents = pendingEvents?.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filterKabKota === "all" || event.kabupaten_kota?.id === filterKabKota;
    return matchesSearch && matchesKabKota;
  }) || [];

  const historyEvents = [...(approvedEvents || []), ...(rejectedEvents || [])].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  const filteredHistoryEvents = historyEvents.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filterKabKota === "all" || event.kabupaten_kota?.id === filterKabKota;
    return matchesSearch && matchesKabKota;
  });

  const handleApprove = async () => {
    if (selectedEvent && user) {
      try {
        await approveEvent.mutateAsync({ 
          eventId: selectedEvent.id, 
          notes: approvalNotes, 
          userId: user.id 
        });
        toast({
          title: "Event Disetujui",
          description: `"${selectedEvent.name}" telah berhasil disetujui.`,
        });
        setShowApproveDialog(false);
        setApprovalNotes("");
        setSelectedEvent(null);
      } catch (error) {
        toast({
          title: "Gagal Menyetujui",
          description: "Terjadi kesalahan saat menyetujui event.",
          variant: "destructive",
        });
      }
    }
  };

  const handleReject = async () => {
    if (selectedEvent && user && rejectReason.trim()) {
      try {
        await rejectEvent.mutateAsync({ 
          eventId: selectedEvent.id, 
          notes: rejectReason, 
          userId: user.id 
        });
        toast({
          title: "Event Ditolak",
          description: `"${selectedEvent.name}" telah ditolak.`,
          variant: "destructive",
        });
        setShowRejectDialog(false);
        setRejectReason("");
        setSelectedEvent(null);
      } catch (error) {
        toast({
          title: "Gagal Menolak",
          description: "Terjadi kesalahan saat menolak event.",
          variant: "destructive",
        });
      }
    }
  };

  const pendingCount = filteredPendingEvents.length;
  const approvedCount = approvedEvents?.length || 0;
  const rejectedCount = rejectedEvents?.length || 0;
  const isLoading = pendingLoading || approvedLoading || rejectedLoading;

  return (
    <AppLayout title="Persetujuan Event">
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row animate-fade-in">
        {/* Left Panel - Event List */}
        <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 border-r border-border flex flex-col bg-muted/30">
          {/* Summary Cards */}
          <div className="p-4 border-b border-border bg-background">
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-warning/10 border-warning/20">
                <CardContent className="p-3 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Menunggu</p>
                </CardContent>
              </Card>
              <Card className="bg-success/10 border-success/20">
                <CardContent className="p-3 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-2xl font-bold text-success">{approvedCount}</p>
                  <p className="text-xs text-muted-foreground">Disetujui</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-3 text-center">
                  <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
                  <p className="text-xs text-muted-foreground">Ditolak</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 space-y-3 border-b border-border bg-background">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterKabKota} onValueChange={setFilterKabKota}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter Kab/Kota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kab/Kota</SelectItem>
                {kabupatenKotaList?.map((kk) => (
                  <SelectItem key={kk.id} value={kk.id}>{kk.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-3 bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="pending" className="relative">
                  Menunggu
                  {pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">Riwayat</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Event List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activeTab === "pending" ? (
                <>
                  {filteredPendingEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada event menunggu</p>
                      <p className="text-sm">Semua pengajuan sudah diproses</p>
                    </div>
                  ) : (
                    filteredPendingEvents.map((event) => (
                      <Card
                        key={event.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedEvent?.id === event.id
                            ? "ring-2 ring-primary border-primary"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{event.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {event.creator?.full_name || "Unknown"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {event.kabupaten_kota?.name || "-"}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.date), "d MMM yyyy", { locale: localeId })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <StatusBadge status="warning">Menunggu Review</StatusBadge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at || new Date()), "d MMM", { locale: localeId })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              ) : (
                <>
                  {filteredHistoryEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada riwayat</p>
                    </div>
                  ) : (
                    filteredHistoryEvents.map((event) => (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{event.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {event.creator?.full_name || "Unknown"}
                              </p>
                            </div>
                            <StatusBadge status={event.status === "DISETUJUI" ? "success" : "error"}>
                              {event.status === "DISETUJUI" ? "Disetujui" : "Ditolak"}
                            </StatusBadge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.kabupaten_kota?.name || "-"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.date), "d MMM yyyy", { locale: localeId })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Event Detail */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedEvent ? (
            <>
              <ScrollArea className="flex-1">
                <div className="p-6 lg:p-8 max-w-3xl">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <StatusBadge status="warning" className="mb-2">Menunggu Review</StatusBadge>
                        <h1 className="text-2xl font-bold">{selectedEvent.name}</h1>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{selectedEvent.creator?.full_name}</p>
                  </div>

                  <Separator className="mb-6" />

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tanggal</p>
                          <p className="font-medium">
                            {format(new Date(selectedEvent.date), "d MMMM yyyy", { locale: localeId })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lokasi</p>
                          <p className="font-medium">{selectedEvent.location || "-"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kabupaten/Kota</p>
                          <p className="font-medium">{selectedEvent.kabupaten_kota?.name || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kategori</p>
                          <p className="font-medium">{selectedEvent.category || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <>
                      <Separator className="mb-6" />
                      <div className="mb-6">
                        <h3 className="font-semibold mb-2">Deskripsi</h3>
                        <p className="text-muted-foreground">{selectedEvent.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="p-4 border-t border-border bg-muted/30">
                <div className="flex gap-3 max-w-3xl">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setShowApproveDialog(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Pilih event untuk melihat detail</p>
                <p className="text-sm">Klik salah satu event di daftar sebelah kiri</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Event</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui event "{selectedEvent?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Tambahkan catatan untuk persetujuan ini..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Batal
            </Button>
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
              Berikan alasan penolakan untuk event "{selectedEvent?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alasan Penolakan *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan event ini..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={rejectEvent.isPending || !rejectReason.trim()}
            >
              {rejectEvent.isPending ? "Menolak..." : "Tolak Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
