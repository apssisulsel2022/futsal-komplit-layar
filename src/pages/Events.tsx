import { useState } from "react";
import { Plus, Search, Filter, Calendar, MapPin, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEvents, getEventStatusDisplay, EventStatus } from "@/hooks/useEvents";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Events() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: events, isLoading } = useEvents();

  const filteredEvents = events?.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      event.status === activeTab;
    return matchesSearch && matchesTab;
  }) || [];

  return (
    <AppLayout title="Event">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Search and Filter */}
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
          <Button variant="outline" size="icon" onClick={() => navigate("/events/calendar")} title="Lihat Kalender">
            <CalendarDays className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
            <TabsTrigger value="DIAJUKAN" className="text-xs">Diajukan</TabsTrigger>
            <TabsTrigger value="DISETUJUI" className="text-xs">Disetujui</TabsTrigger>
            <TabsTrigger value="DITOLAK" className="text-xs">Ditolak</TabsTrigger>
            <TabsTrigger value="SELESAI" className="text-xs">Selesai</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Event List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {searchQuery ? "Tidak ada event yang cocok" : "Belum ada event"}
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => {
              const statusDisplay = getEventStatusDisplay(event.status as EventStatus);

              return (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">{event.name}</h3>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.date), "d MMM yyyy", { locale: id })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={statusDisplay.variant}>
                            {statusDisplay.label}
                          </StatusBadge>
                          {event.kabupaten_kota && (
                            <span className="text-xs text-muted-foreground">
                              {event.kabupaten_kota.name}
                            </span>
                          )}
                        </div>
                        {event.category && (
                          <span className="text-xs text-muted-foreground">
                            {event.category}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-24 right-4 md:bottom-8 rounded-full shadow-lg h-14 w-14 p-0"
          onClick={() => navigate("/events/submit")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
