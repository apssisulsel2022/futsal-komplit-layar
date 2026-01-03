import { useState } from "react";
import { 
  Wallet, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  FileCheck,
  Plus,
  X,
  LayoutDashboard,
  CalendarDays,
  User,
  Loader2
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHonors, useCreateHonor, useUpdateHonor, useHonorStats, Honor } from "@/hooks/useHonors";
import { useEvents } from "@/hooks/useEvents";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusConfig = (status: Honor["status"]) => {
  switch (status) {
    case "draft":
      return { 
        label: "Draft", 
        variant: "neutral" as const,
        icon: Clock,
        color: "text-muted-foreground"
      };
    case "submitted":
      return { 
        label: "Menunggu Verifikasi", 
        variant: "warning" as const,
        icon: Send,
        color: "text-warning"
      };
    case "verified":
      return { 
        label: "Terverifikasi", 
        variant: "success" as const,
        icon: CheckCircle2,
        color: "text-success"
      };
    case "rejected":
      return { 
        label: "Ditolak", 
        variant: "error" as const,
        icon: X,
        color: "text-destructive"
      };
    default:
      return { 
        label: status, 
        variant: "neutral" as const,
        icon: Clock,
        color: "text-muted-foreground"
      };
  }
};

export default function RefereeHonor() {
  const location = useLocation();
  const [showInputForm, setShowInputForm] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  
  // Form state
  const [selectedEvent, setSelectedEvent] = useState("");
  const [honorAmount, setHonorAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Hooks
  const { data: honors, isLoading: honorsLoading } = useHonors();
  const { data: events } = useEvents();
  const { data: honorStats } = useHonorStats();
  const createHonor = useCreateHonor();
  const updateHonor = useUpdateHonor();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
    { icon: CalendarDays, label: "Event", path: "/referee/events" },
    { icon: Wallet, label: "Honor", path: "/referee/honor" },
    { icon: User, label: "Profil", path: "/referee/profile" },
  ];

  const validateForm = (): boolean => {
    if (!selectedEvent) {
      setFormError("Pilih event terlebih dahulu");
      return false;
    }
    
    const amount = parseInt(honorAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      setFormError("Masukkan jumlah honor yang valid");
      return false;
    }
    
    if (amount > 10000000) {
      setFormError("Jumlah honor maksimal Rp 10.000.000");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    await createHonor.mutateAsync({
      event_id: selectedEvent,
      amount: parseInt(honorAmount.replace(/\D/g, "")),
      notes: notes.trim() || undefined,
      status: "draft",
    });

    resetForm();
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    await createHonor.mutateAsync({
      event_id: selectedEvent,
      amount: parseInt(honorAmount.replace(/\D/g, "")),
      notes: notes.trim() || undefined,
      status: "submitted",
    });

    resetForm();
    setShowSubmitDialog(false);
  };

  const resetForm = () => {
    setSelectedEvent("");
    setHonorAmount("");
    setNotes("");
    setFormError(null);
    setShowInputForm(false);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      const formatted = new Intl.NumberFormat("id-ID").format(parseInt(numericValue));
      setHonorAmount(formatted);
    } else {
      setHonorAmount("");
    }
  };

  const submitDraft = async (entry: Honor) => {
    await updateHonor.mutateAsync({
      id: entry.id,
      status: "submitted",
    });
  };

  if (honorsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-accent px-4 pt-12 pb-6">
        <h1 className="text-xl font-bold text-primary-foreground mb-1">Honor Wasit</h1>
        <p className="text-sm text-primary-foreground/80">Kelola dan lacak honor Anda</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-success/10 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Terverifikasi</span>
              </div>
              <p className="text-lg font-bold text-success">
                {formatCurrency(honorStats?.verified || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Menunggu</span>
              </div>
              <p className="text-lg font-bold text-warning">
                {formatCurrency(honorStats?.pending || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Honor Button or Form */}
        {!showInputForm ? (
          <Button 
            className="w-full h-12"
            onClick={() => setShowInputForm(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Input Honor Baru
          </Button>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Input Honor Baru
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Warning Alert */}
              <Alert className="bg-warning/10 border-warning/30">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-sm text-warning">
                  Honor akan diverifikasi oleh Admin sebelum diproses.
                </AlertDescription>
              </Alert>

              {/* Event Selection */}
              <div className="space-y-2">
                <Label htmlFor="event">Event <span className="text-destructive">*</span></Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex flex-col">
                          <span>{event.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.date), "dd MMM yyyy", { locale: id })} • {event.location || "Lokasi belum ditentukan"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Event Info */}
              {selectedEvent && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    {(() => {
                      const event = events?.find(e => e.id === selectedEvent);
                      return event ? (
                        <div className="space-y-1.5">
                          <p className="font-medium text-sm">{event.name}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.date), "dd MMM yyyy", { locale: id })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location || "Lokasi belum ditentukan"}
                            </span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Honor Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Honor <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={honorAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-10 text-right text-lg font-semibold"
                    maxLength={15}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  placeholder="Contoh: 3 pertandingan sebagai wasit utama..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notes.length}/200
                </p>
              </div>

              {/* Error Message */}
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSaveDraft}
                  disabled={createHonor.isPending}
                >
                  {createHonor.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Simpan Draft"
                  )}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={createHonor.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Ajukan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Section */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Riwayat Honor
          </h2>

          {(!honors || honors.length === 0) ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Belum ada riwayat</p>
                <p className="text-sm">Input honor pertama Anda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {honors.map((entry) => {
                const statusConfig = getStatusConfig(entry.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {entry.events?.name || "Event tidak ditemukan"}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {entry.events?.date 
                              ? format(new Date(entry.events.date), "dd MMM yyyy", { locale: id })
                              : "-"
                            }
                          </p>
                        </div>
                        <StatusBadge status={
                          entry.status === "verified" ? "success" : 
                          entry.status === "submitted" ? "warning" : 
                          entry.status === "rejected" ? "error" : "neutral"
                        }>
                          {statusConfig.label}
                        </StatusBadge>
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {entry.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <p className={`text-lg font-bold ${statusConfig.color}`}>
                          {formatCurrency(entry.amount)}
                        </p>
                        {entry.status === "draft" && (
                          <Button 
                            size="sm" 
                            onClick={() => submitDraft(entry)}
                            disabled={updateHonor.isPending}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Ajukan
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengajuan</DialogTitle>
            <DialogDescription>
              Setelah diajukan, honor akan menunggu verifikasi dari admin. 
              Anda tidak dapat mengubah data setelah diajukan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Batal
            </Button>
            <Button onClick={confirmSubmit} disabled={createHonor.isPending}>
              {createHonor.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Ya, Ajukan
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
