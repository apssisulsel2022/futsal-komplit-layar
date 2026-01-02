import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Search,
  UserPlus,
  UserMinus,
  Star,
  Check,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Mock event data
const eventData = {
  id: 1,
  name: "Piala Walikota Futsal 2025",
  date: "15-20 Januari 2025",
  location: "GOR Sudiang, Makassar",
  organizer: "Pengcab Futsal Makassar",
  status: "approved",
  requiredReferees: 4,
};

// Mock referee data
const allReferees = [
  {
    id: 1,
    name: "Ahmad Rizky",
    license: "Lisensi A",
    rating: 4.8,
    totalMatches: 124,
    kabKota: "Makassar",
    available: true,
  },
  {
    id: 2,
    name: "Budi Santoso",
    license: "Lisensi A",
    rating: 4.6,
    totalMatches: 98,
    kabKota: "Gowa",
    available: true,
  },
  {
    id: 3,
    name: "Cahya Putra",
    license: "Lisensi B",
    rating: 4.5,
    totalMatches: 76,
    kabKota: "Maros",
    available: true,
  },
  {
    id: 4,
    name: "Dedi Wijaya",
    license: "Lisensi B",
    rating: 4.3,
    totalMatches: 52,
    kabKota: "Makassar",
    available: false,
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    license: "Lisensi C",
    rating: 4.1,
    totalMatches: 28,
    kabKota: "Takalar",
    available: true,
  },
  {
    id: 6,
    name: "Fajar Ramadhan",
    license: "Lisensi C",
    rating: 4.0,
    totalMatches: 15,
    kabKota: "Gowa",
    available: true,
  },
];

export default function RefereeAssignment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedReferees, setAssignedReferees] = useState<number[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "assign" | "remove";
    referee: (typeof allReferees)[0] | null;
  }>({ open: false, action: "assign", referee: null });

  const availableReferees = allReferees.filter(
    (ref) => !assignedReferees.includes(ref.id) && ref.available
  );

  const assignedRefereesList = allReferees.filter((ref) =>
    assignedReferees.includes(ref.id)
  );

  const filteredReferees = availableReferees.filter((ref) =>
    ref.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = (referee: (typeof allReferees)[0]) => {
    setConfirmDialog({ open: true, action: "assign", referee });
  };

  const handleRemove = (referee: (typeof allReferees)[0]) => {
    setConfirmDialog({ open: true, action: "remove", referee });
  };

  const confirmAction = () => {
    if (!confirmDialog.referee) return;

    if (confirmDialog.action === "assign") {
      setAssignedReferees((prev) => [...prev, confirmDialog.referee!.id]);
      toast({
        title: "Wasit Ditugaskan",
        description: `${confirmDialog.referee.name} berhasil ditugaskan ke event ini.`,
      });
    } else {
      setAssignedReferees((prev) =>
        prev.filter((id) => id !== confirmDialog.referee!.id)
      );
      toast({
        title: "Penugasan Dibatalkan",
        description: `${confirmDialog.referee.name} telah dihapus dari event ini.`,
      });
    }
    setConfirmDialog({ open: false, action: "assign", referee: null });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Penugasan Wasit</h1>
            <p className="text-xs text-muted-foreground">
              Tugaskan wasit untuk event yang disetujui
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 pb-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Event Info & Assigned Referees */}
          <div className="lg:col-span-1 space-y-4">
            {/* Event Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Informasi Event</CardTitle>
                    </div>
                  </div>
                  <StatusBadge status="success">Disetujui</StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{eventData.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{eventData.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{eventData.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{eventData.organizer}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Kebutuhan Wasit
                    </span>
                    <Badge
                      variant={
                        assignedReferees.length >= eventData.requiredReferees
                          ? "default"
                          : "secondary"
                      }
                    >
                      {assignedReferees.length} / {eventData.requiredReferees}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Referees */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Wasit Ditugaskan
                </CardTitle>
                <CardDescription>
                  {assignedRefereesList.length === 0
                    ? "Belum ada wasit yang ditugaskan"
                    : `${assignedRefereesList.length} wasit telah ditugaskan`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedRefereesList.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Pilih wasit dari daftar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedRefereesList.map((referee) => (
                      <div
                        key={referee.id}
                        className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-success/10 text-success font-semibold">
                              {referee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{referee.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {referee.license}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(referee)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button - Mobile */}
            <div className="lg:hidden">
              <Button
                className="w-full h-12"
                disabled={assignedReferees.length === 0}
                onClick={() => {
                  toast({
                    title: "Penugasan Disimpan",
                    description: `${assignedReferees.length} wasit telah ditugaskan untuk event ini.`,
                  });
                  navigate(-1);
                }}
              >
                Simpan Penugasan ({assignedReferees.length})
              </Button>
            </div>
          </div>

          {/* Right Column - Available Referees */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Wasit Tersedia</CardTitle>
                    <CardDescription>
                      Pilih wasit untuk ditugaskan ke event ini
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari wasit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredReferees.map((referee) => (
                    <Card
                      key={referee.id}
                      className="border-border hover:border-primary/30 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {referee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{referee.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-xs">
                                  {referee.license}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {referee.kabKota}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-sm">
                              <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                              {referee.rating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {referee.totalMatches} pertandingan
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAssign(referee)}
                            disabled={
                              assignedReferees.length >= eventData.requiredReferees
                            }
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Tugaskan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredReferees.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Tidak ada wasit tersedia</p>
                    {searchQuery && (
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="mt-1"
                      >
                        Reset pencarian
                      </Button>
                    )}
                  </div>
                )}

                {/* Unavailable Referees Section */}
                {allReferees.some((ref) => !ref.available) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Wasit Tidak Tersedia
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allReferees
                        .filter((ref) => !ref.available)
                        .map((referee) => (
                          <Card
                            key={referee.id}
                            className="border-border bg-muted/30 opacity-60"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                    {referee.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {referee.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {referee.license} • Sedang bertugas
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button - Desktop */}
        <div className="hidden lg:flex justify-end mt-6">
          <Button
            size="lg"
            disabled={assignedReferees.length === 0}
            onClick={() => {
              toast({
                title: "Penugasan Disimpan",
                description: `${assignedReferees.length} wasit telah ditugaskan untuk event ini.`,
              });
              navigate(-1);
            }}
          >
            Simpan Penugasan ({assignedReferees.length} wasit)
          </Button>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "assign"
                ? "Tugaskan Wasit?"
                : "Batalkan Penugasan?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "assign"
                ? `${confirmDialog.referee?.name} akan ditugaskan ke ${eventData.name}.`
                : `${confirmDialog.referee?.name} akan dihapus dari penugasan ${eventData.name}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                confirmDialog.action === "remove"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmDialog.action === "assign" ? "Tugaskan" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
