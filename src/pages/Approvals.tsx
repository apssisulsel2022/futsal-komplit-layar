import { useState } from "react";
import { Search, Filter, Calendar, MapPin, CheckCircle, XCircle, Clock, Eye, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const pendingEvents = [
  {
    id: 1,
    name: "Liga Futsal Gowa 2024",
    organizer: "Asosiasi Futsal Gowa",
    date: "1 Feb - 28 Feb 2024",
    location: "GOR Gowa",
    submittedAt: "2 hari lalu",
    teams: 12,
    matches: 24,
    referees: 4,
    description: "Kompetisi futsal tahunan tingkat Kabupaten Gowa dengan partisipasi 12 tim.",
  },
  {
    id: 2,
    name: "Turnamen Futsal Pelajar Maros",
    organizer: "Dinas Pendidikan Maros",
    date: "15 Feb - 20 Feb 2024",
    location: "GOR Maros",
    submittedAt: "3 hari lalu",
    teams: 16,
    matches: 20,
    referees: 4,
    description: "Turnamen futsal untuk pelajar SMA/SMK se-Kabupaten Maros.",
  },
  {
    id: 3,
    name: "Piala Wali Kota Makassar",
    organizer: "Pemkot Makassar",
    date: "1 Mar - 15 Mar 2024",
    location: "GOR Sudiang",
    submittedAt: "5 hari lalu",
    teams: 24,
    matches: 48,
    referees: 8,
    description: "Turnamen futsal prestisius tingkat Kota Makassar.",
  },
  {
    id: 4,
    name: "Liga Futsal Antar Kampus",
    organizer: "BEM se-Sul-Sel",
    date: "10 Mar - 25 Mar 2024",
    location: "GOR Mattoangin",
    submittedAt: "1 minggu lalu",
    teams: 20,
    matches: 32,
    referees: 6,
    description: "Kompetisi futsal antar kampus se-Sulawesi Selatan.",
  },
  {
    id: 5,
    name: "Turnamen Futsal Ramadan",
    organizer: "Remaja Masjid Al-Markaz",
    date: "15 Mar - 30 Mar 2024",
    location: "GOR Sudiang",
    submittedAt: "1 minggu lalu",
    teams: 16,
    matches: 24,
    referees: 4,
    description: "Turnamen futsal menyambut bulan suci Ramadan.",
  },
];

const historyEvents = [
  {
    id: 101,
    name: "Liga Futsal Makassar 2024",
    organizer: "FFSS Makassar",
    date: "15 Jan - 28 Feb 2024",
    status: "approved",
    approvedAt: "10 Jan 2024",
  },
  {
    id: 102,
    name: "Turnamen Antar Kabupaten",
    organizer: "FFSS Sul-Sel",
    date: "22 Jan - 5 Feb 2024",
    status: "approved",
    approvedAt: "18 Jan 2024",
  },
  {
    id: 103,
    name: "Piala Gubernur Sul-Sel",
    organizer: "Pemprov Sul-Sel",
    date: "5 Feb - 20 Feb 2024",
    status: "approved",
    approvedAt: "1 Feb 2024",
  },
  {
    id: 104,
    name: "Turnamen Futsal RT/RW",
    organizer: "Kelurahan Panakkukang",
    date: "10 Feb - 15 Feb 2024",
    status: "rejected",
    rejectedAt: "5 Feb 2024",
    reason: "Tidak memenuhi standar minimum peserta",
  },
];

export default function Approvals() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<typeof pendingEvents[0] | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const filteredPendingEvents = pendingEvents.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = () => {
    // Simulate approval
    setShowApproveDialog(false);
    setSelectedEvent(null);
  };

  const handleReject = () => {
    // Simulate rejection
    setShowRejectDialog(false);
    setRejectReason("");
    setSelectedEvent(null);
  };

  return (
    <AppLayout title="Persetujuan Event">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
              <p className="text-2xl font-bold">{pendingEvents.length}</p>
              <p className="text-xs text-muted-foreground">Menunggu</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold">{historyEvents.filter(e => e.status === "approved").length}</p>
              <p className="text-xs text-muted-foreground">Disetujui</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-2xl font-bold">{historyEvents.filter(e => e.status === "rejected").length}</p>
              <p className="text-xs text-muted-foreground">Ditolak</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pending" className="relative">
              Menunggu
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                {pendingEvents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pending Events */}
        {activeTab === "pending" && (
          <div className="space-y-3">
            {filteredPendingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.organizer}</p>
                    </div>
                    <StatusBadge status="warning">Menunggu</StatusBadge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-3 border-b border-border">
                    <span>{event.teams} Tim</span>
                    <span>{event.matches} Pertandingan</span>
                    <span>{event.referees} Wasit</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Diajukan {event.submittedAt}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Tolak
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowApproveDialog(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Setujui
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {historyEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{event.name}</h3>
                      <p className="text-xs text-muted-foreground">{event.organizer}</p>
                    </div>
                    <StatusBadge status={event.status === "approved" ? "success" : "error"}>
                      {event.status === "approved" ? "Disetujui" : "Ditolak"}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {event.date}
                  </div>
                  {event.status === "rejected" && event.reason && (
                    <p className="text-xs text-destructive mt-2">
                      Alasan: {event.reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setujui Event</DialogTitle>
              <DialogDescription>
                Anda yakin ingin menyetujui event "{selectedEvent?.name}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Setujui
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
            <Textarea
              placeholder="Masukkan alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Tolak
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
