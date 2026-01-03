import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Calendar, MapPin, Users, ChevronRight, ClipboardList } from "lucide-react";
import { useEvaluatableEvents, useCreateEvaluation } from "@/hooks/useEvaluations";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface EventAssignment {
  id: string;
  referee_id: string;
  status: string;
  referee: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

interface EvaluatableEvent {
  id: string;
  name: string;
  date: string;
  location: string | null;
  event_assignments: EventAssignment[];
}

export default function EvaluationNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: events, isLoading } = useEvaluatableEvents();
  const createEvaluation = useCreateEvaluation();
  const [selectedEvent, setSelectedEvent] = useState<EvaluatableEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  const handleSelectReferee = async (refereeId: string) => {
    if (!selectedEvent || !user) return;

    setIsCreating(true);
    try {
      const evaluation = await createEvaluation.mutateAsync({
        event_id: selectedEvent.id,
        referee_id: refereeId,
        evaluator_id: user.id,
      });

      toast.success("Evaluasi dibuat");
      navigate(`/evaluations/${evaluation.id}`);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Evaluasi untuk wasit ini di event ini sudah ada");
      } else {
        toast.error("Gagal membuat evaluasi");
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Buat Evaluasi Baru" showBackButton onBack={() => navigate("/evaluations")}>
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </AppLayout>
    );
  }

  // Filter out events with no confirmed assignments
  const validEvents = events?.filter(
    (e) => e.event_assignments && e.event_assignments.length > 0
  ) as EvaluatableEvent[] || [];

  if (selectedEvent) {
    return (
      <AppLayout
        title="Pilih Wasit"
        showBackButton
        onBack={() => setSelectedEvent(null)}
      >
        <div className="p-4 space-y-4">
          {/* Event Info */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold">{selectedEvent.name}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(selectedEvent.date), "d MMMM yyyy", { locale: localeId })}
                </span>
                {selectedEvent.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.location}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referee List */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Pilih wasit untuk dievaluasi:
            </h4>
            {selectedEvent.event_assignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectReferee(assignment.referee_id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={assignment.referee.profile_photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(assignment.referee.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{assignment.referee.full_name}</p>
                      <p className="text-xs text-muted-foreground">Wasit</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isCreating && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Membuat evaluasi...</p>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Buat Evaluasi Baru" showBackButton onBack={() => navigate("/evaluations")}>
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Pilih event yang sudah selesai untuk mengevaluasi wasit:
        </p>

        {validEvents.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Tidak ada event"
            description="Belum ada event selesai dengan wasit yang bisa dievaluasi"
          />
        ) : (
          validEvents.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedEvent(event)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{event.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.date), "d MMM yyyy", { locale: localeId })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{event.event_assignments.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
