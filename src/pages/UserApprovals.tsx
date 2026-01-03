import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock, User, MapPin, Calendar, FileText, Loader2 } from "lucide-react";
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
import { usePendingRegistrations, useRegistrationHistory, useApproveRegistration, useRejectRegistration } from "@/hooks/useRegistrations";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface PendingUser {
  id: string;
  full_name: string;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  requested_role: string | null;
  registration_status: string | null;
  created_at: string | null;
}

export default function UserApprovals() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKabKota, setFilterKabKota] = useState("all");
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: pendingUsers, isLoading: loadingPending } = usePendingRegistrations();
  const { data: historyUsers, isLoading: loadingHistory } = useRegistrationHistory();
  const approveRegistration = useApproveRegistration();
  const rejectRegistration = useRejectRegistration();

  const kabKotaOptions = Array.from(
    new Set(pendingUsers?.map((u) => u.kabupaten_kota_name).filter(Boolean) || [])
  );

  const filteredPendingUsers = pendingUsers?.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filterKabKota === "all" || user.kabupaten_kota_name === filterKabKota;
    return matchesSearch && matchesKabKota;
  }) || [];

  const filteredHistoryUsers = historyUsers?.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKabKota = filterKabKota === "all" || user.kabupaten_kota_name === filterKabKota;
    return matchesSearch && matchesKabKota;
  }) || [];

  const handleApprove = async () => {
    if (!selectedUser || !selectedUser.requested_role) return;

    try {
      await approveRegistration.mutateAsync({
        userId: selectedUser.id,
        role: selectedUser.requested_role as "wasit" | "panitia",
      });
      toast({
        title: "Pendaftaran Disetujui",
        description: `"${selectedUser.full_name}" telah disetujui sebagai ${selectedUser.requested_role}.`,
      });
      setShowApproveDialog(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Gagal Menyetujui",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;

    if (!rejectReason.trim()) {
      toast({
        title: "Alasan Diperlukan",
        description: "Mohon masukkan alasan penolakan",
        variant: "destructive",
      });
      return;
    }

    try {
      await rejectRegistration.mutateAsync({
        userId: selectedUser.id,
        reason: rejectReason,
      });
      toast({
        title: "Pendaftaran Ditolak",
        description: `"${selectedUser.full_name}" telah ditolak.`,
        variant: "destructive",
      });
      setShowRejectDialog(false);
      setRejectReason("");
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Gagal Menolak",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "wasit":
        return "Wasit";
      case "panitia":
        return "Panitia";
      default:
        return role || "-";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "d MMM yyyy, HH:mm", { locale: localeId });
  };

  const pendingCount = pendingUsers?.length || 0;

  return (
    <AppLayout title="Persetujuan Pendaftaran">
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row animate-fade-in">
        {/* Left Panel - User List */}
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
                  <p className="text-2xl font-bold text-success">
                    {historyUsers?.filter((u) => u.registration_status === "approved").length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Disetujui</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-3 text-center">
                  <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-2xl font-bold text-destructive">
                    {historyUsers?.filter((u) => u.registration_status === "rejected").length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Ditolak</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 space-y-3 border-b border-border bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {kabKotaOptions.length > 0 && (
              <Select value={filterKabKota} onValueChange={setFilterKabKota}>
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter Kab/Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kab/Kota</SelectItem>
                  {kabKotaOptions.map((option) => (
                    <SelectItem key={option} value={option!}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

          {/* User List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {activeTab === "pending" && (
                <>
                  {loadingPending ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </div>
                  ) : filteredPendingUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada pendaftaran menunggu</p>
                      <p className="text-sm">Semua pendaftaran sudah diproses</p>
                    </div>
                  ) : (
                    filteredPendingUsers.map((user) => (
                      <Card
                        key={user.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedUser?.id === user.id
                            ? "ring-2 ring-primary border-primary"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{user.full_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Ingin menjadi <span className="font-medium">{getRoleLabel(user.requested_role)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {user.kabupaten_kota_name || "-"}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(user.created_at)}
                            </span>
                          </div>
                          <div className="mt-3">
                            <StatusBadge status="warning">Menunggu Review</StatusBadge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}

              {activeTab === "history" && (
                <>
                  {loadingHistory ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </div>
                  ) : filteredHistoryUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada riwayat</p>
                    </div>
                  ) : (
                    filteredHistoryUsers.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{user.full_name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {getRoleLabel(user.requested_role)}
                              </p>
                            </div>
                            <StatusBadge
                              status={user.registration_status === "approved" ? "success" : "error"}
                            >
                              {user.registration_status === "approved" ? "Disetujui" : "Ditolak"}
                            </StatusBadge>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.kabupaten_kota_name || "-"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Diproses: {formatDate(user.approved_at)}
                            {user.approver_name && ` oleh ${user.approver_name}`}
                          </p>
                          {user.registration_status === "rejected" && user.rejected_reason && (
                            <p className="text-xs text-destructive mt-2 p-2 bg-destructive/10 rounded">
                              Alasan: {user.rejected_reason}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - User Detail */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedUser ? (
            <>
              <ScrollArea className="flex-1">
                <div className="p-6 lg:p-8 max-w-3xl">
                  {/* Header */}
                  <div className="mb-6">
                    <StatusBadge status="warning" className="mb-2">
                      Menunggu Review
                    </StatusBadge>
                    <h1 className="text-2xl font-bold">{selectedUser.full_name}</h1>
                    <p className="text-muted-foreground">
                      Ingin mendaftar sebagai {getRoleLabel(selectedUser.requested_role)}
                    </p>
                  </div>

                  <Separator className="mb-6" />

                  {/* User Details */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Role yang Diminta</p>
                          <p className="font-medium">{getRoleLabel(selectedUser.requested_role)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Kabupaten/Kota</p>
                          <p className="font-medium">{selectedUser.kabupaten_kota_name || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tanggal Daftar</p>
                          <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="border-t border-border p-4 bg-background">
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
                <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Pilih pendaftaran untuk melihat detail</p>
                <p className="text-sm">Klik pada daftar di sebelah kiri</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Pendaftaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui pendaftaran "{selectedUser?.full_name}" sebagai{" "}
              {getRoleLabel(selectedUser?.requested_role || null)}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={approveRegistration.isPending}>
              {approveRegistration.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyetujui...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Setujui
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran</DialogTitle>
            <DialogDescription>
              Berikan alasan mengapa pendaftaran "{selectedUser?.full_name}" ditolak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Alasan Penolakan</Label>
            <Textarea
              id="rejectReason"
              placeholder="Masukkan alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectRegistration.isPending}
            >
              {rejectRegistration.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menolak...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
