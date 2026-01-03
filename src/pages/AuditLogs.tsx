import { useState } from "react";
import { Search, Filter, Calendar, User, FileText, Loader2, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuditLogs, getActionLabel, getActionVariant, AuditLog, AuditAction, EntityType } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [limit] = useState(50);

  const { data: logs, isLoading, refetch } = useAuditLogs({
    entityType: filterEntityType !== "all" ? filterEntityType as EntityType : undefined,
    action: filterAction !== "all" ? filterAction as AuditAction : undefined,
    limit,
  });

  const entityTypeOptions = [
    { value: "all", label: "Semua Entitas" },
    { value: "events", label: "Event" },
    { value: "event_assignments", label: "Penugasan Wasit" },
    { value: "honors", label: "Honor" },
    { value: "profiles", label: "Profil" },
  ];

  const actionOptions = [
    { value: "all", label: "Semua Aksi" },
    { value: "EVENT_APPROVAL", label: "Persetujuan Event" },
    { value: "REFEREE_ASSIGNED", label: "Wasit Ditugaskan" },
    { value: "REFEREE_ASSIGNMENT_UPDATED", label: "Penugasan Diupdate" },
    { value: "REFEREE_UNASSIGNED", label: "Wasit Dicopot" },
    { value: "HONOR_SUBMITTED", label: "Honor Disubmit" },
    { value: "HONOR_VERIFIED", label: "Honor Diverifikasi" },
    { value: "HONOR_REJECTED", label: "Honor Ditolak" },
    { value: "SOFT_DELETE", label: "Data Dihapus" },
  ];

  const filteredLogs = (logs || []).filter((log) => {
    if (!searchQuery) return true;
    return (
      log.actor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeFiltersCount = [
    filterEntityType !== "all" ? 1 : 0,
    filterAction !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    setFilterEntityType("all");
    setFilterAction("all");
    setSearchQuery("");
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case "events": return "Event";
      case "event_assignments": return "Penugasan";
      case "honors": return "Honor";
      case "profiles": return "Profil";
      default: return type;
    }
  };

  return (
    <AppLayout title="Audit Logs">
      <div className="min-h-screen pb-4 animate-fade-in">
        {/* Header */}
        <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Log Aktivitas</h1>
              <p className="text-sm text-muted-foreground">Pantau semua aktivitas sistem</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 space-y-3 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari log..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden relative">
                  <Filter className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>Filter</SheetTitle>
                  <SheetDescription>Filter log aktivitas</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Jenis Entitas</label>
                    <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Entitas" />
                      </SelectTrigger>
                      <SelectContent>
                        {entityTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Aksi</label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Aksi" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      Reset
                    </Button>
                    <Button className="flex-1" onClick={() => setShowFilters(false)}>
                      Terapkan
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-3">
            <Select value={filterEntityType} onValueChange={setFilterEntityType}>
              <SelectTrigger className="w-[180px]">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Entitas" />
              </SelectTrigger>
              <SelectContent>
                {entityTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Aksi" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block p-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Waktu</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Entitas</TableHead>
                      <TableHead>Pelaku</TableHead>
                      <TableHead className="text-center">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">Tidak ada log</p>
                          <p className="text-sm">Coba ubah filter pencarian</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow 
                          key={log.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: localeId })}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={getActionVariant(log.action as AuditAction)}>
                              {getActionLabel(log.action as AuditAction)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>{getEntityTypeLabel(log.entity_type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <span>{log.actor_name || "System"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">
                              Lihat
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-4">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada log</p>
                      <p className="text-sm">Coba ubah filter pencarian</p>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <Card 
                        key={log.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedLog(log)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <StatusBadge status={getActionVariant(log.action as AuditAction)}>
                              {getActionLabel(log.action as AuditAction)}
                            </StatusBadge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "d MMM HH:mm", { locale: localeId })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{getEntityTypeLabel(log.entity_type)}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{log.actor_name || "System"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Log</DialogTitle>
            <DialogDescription>
              Informasi lengkap aktivitas
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Waktu</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "d MMMM yyyy HH:mm:ss", { locale: localeId })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pelaku</p>
                  <p className="font-medium">{selectedLog.actor_name || "System"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aksi</p>
                  <StatusBadge status={getActionVariant(selectedLog.action as AuditAction)}>
                    {getActionLabel(selectedLog.action as AuditAction)}
                  </StatusBadge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entitas</p>
                  <p className="font-medium">{getEntityTypeLabel(selectedLog.entity_type)}</p>
                </div>
              </div>

              {selectedLog.old_data && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data Lama</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data Baru</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Metadata</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
