import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents, getEventStatusDisplay, type Event, type EventStatus } from "@/hooks/useEvents";
import { useKabupatenKota } from "@/hooks/useUsers";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function EventCalendar() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [kabupatenFilter, setKabupatenFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: kabupatenList, isLoading: kabupatenLoading } = useKabupatenKota();

  // Filter events based on filters
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event) => {
      const matchKabupaten = kabupatenFilter === "all" || event.kabupaten_kota_id === kabupatenFilter;
      const matchStatus = statusFilter === "all" || event.status === statusFilter;
      return matchKabupaten && matchStatus;
    });
  }, [events, kabupatenFilter, statusFilter]);

  // Get events for selected date
  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate || !filteredEvents) return [];
    return filteredEvents.filter((event) => 
      isSameDay(new Date(event.date), selectedDate)
    );
  }, [selectedDate, filteredEvents]);

  // Get events count per day for the current month
  const eventCountByDate = useMemo(() => {
    if (!filteredEvents) return new Map<string, number>();
    const countMap = new Map<string, number>();
    
    filteredEvents.forEach((event) => {
      const dateKey = format(new Date(event.date), "yyyy-MM-dd");
      countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
    });
    
    return countMap;
  }, [filteredEvents]);

  // Get events in current month
  const eventsInMonth = useMemo(() => {
    if (!filteredEvents) return [];
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate <= end;
    });
  }, [filteredEvents, currentMonth]);

  const hasActiveFilters = kabupatenFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setKabupatenFilter("all");
    setStatusFilter("all");
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Custom day render for calendar
  const modifiers = useMemo(() => {
    const hasEvents: Date[] = [];
    const hasMultipleEvents: Date[] = [];
    
    eventCountByDate.forEach((count, dateKey) => {
      const date = new Date(dateKey);
      if (count >= 1) hasEvents.push(date);
      if (count >= 3) hasMultipleEvents.push(date);
    });
    
    return {
      hasEvents,
      hasMultipleEvents,
    };
  }, [eventCountByDate]);

  const modifiersStyles = {
    hasEvents: {
      fontWeight: "bold" as const,
    },
  };

  if (eventsLoading || kabupatenLoading) {
    return (
      <AppLayout title="Kalender Event">
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-[350px]" />
            <Skeleton className="h-[350px]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Kalender Event">
      <div className="p-4 space-y-4">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy", { locale: localeId })}
            </h2>
            <span className="text-sm text-muted-foreground">
              ({eventsInMonth.length} event)
            </span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hari Ini
            </Button>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              
              <Select value={kabupatenFilter} onValueChange={setKabupatenFilter}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Semua Kabupaten/Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kabupaten/Kota</SelectItem>
                  {kabupatenList?.map((kab) => (
                    <SelectItem key={kab.id} value={kab.id}>
                      {kab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                  <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                  <SelectItem value="DITOLAK">Ditolak</SelectItem>
                  <SelectItem value="SELESAI">Selesai</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
                  <X className="h-3 w-3" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pilih Tanggal</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border pointer-events-auto"
                components={{
                  DayContent: ({ date }) => {
                    const dateKey = format(date, "yyyy-MM-dd");
                    const count = eventCountByDate.get(dateKey) || 0;
                    return (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <span>{date.getDate()}</span>
                        {count > 0 && (
                          <div className="absolute bottom-0 flex gap-0.5">
                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-1 h-1 rounded-full",
                                  count >= 3 ? "bg-destructive" : count >= 2 ? "bg-amber-500" : "bg-primary"
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Events on selected date */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>
                  Event pada {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: localeId }) : "-"}
                </span>
                {isToday(selectedDate || new Date()) && (
                  <Badge variant="secondary">Hari Ini</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsOnSelectedDate.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada event pada tanggal ini</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {eventsOnSelectedDate.map((event) => {
                    const statusDisplay = getEventStatusDisplay(event.status);
                    return (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{event.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {event.location || event.kabupaten_kota?.name || "-"}
                              </span>
                            </div>
                            {event.category && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {event.category}
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant={
                              statusDisplay.variant === "success" ? "default" :
                              statusDisplay.variant === "warning" ? "secondary" :
                              statusDisplay.variant === "error" ? "destructive" : "outline"
                            }
                            className="text-xs shrink-0"
                          >
                            {statusDisplay.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming events list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Event Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {eventsInMonth.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Tidak ada event di bulan ini</p>
              </div>
            ) : (
              <div className="divide-y">
                {eventsInMonth
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => {
                    const statusDisplay = getEventStatusDisplay(event.status);
                    const eventDate = new Date(event.date);
                    const isPast = eventDate < new Date() && !isToday(eventDate);
                    
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "py-3 flex items-center gap-4 cursor-pointer hover:bg-accent/50 -mx-3 px-3 rounded-lg transition-colors",
                          isPast && "opacity-60"
                        )}
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className={cn(
                          "flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0",
                          isToday(eventDate) ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <span className="text-xs font-medium">
                            {format(eventDate, "MMM", { locale: localeId })}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {format(eventDate, "d")}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{event.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.kabupaten_kota?.name || "-"}
                            </span>
                            {event.category && (
                              <span className="flex items-center gap-1">
                                • {event.category}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Badge
                          variant={
                            statusDisplay.variant === "success" ? "default" :
                            statusDisplay.variant === "warning" ? "secondary" :
                            statusDisplay.variant === "error" ? "destructive" : "outline"
                          }
                          className="text-xs shrink-0"
                        >
                          {statusDisplay.label}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
