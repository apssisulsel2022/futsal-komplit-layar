import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RefereeEventAssignment {
  id: string;
  event_id: string;
  referee_id: string;
  role: "UTAMA" | "CADANGAN";
  status: "pending" | "confirmed" | "cancelled" | "declined";
  created_at: string;
  updated_at: string;
  event: {
    id: string;
    name: string;
    date: string;
    location: string | null;
    status: string;
    category: string | null;
    kabupaten_kota: {
      id: string;
      name: string;
    } | null;
  } | null;
  // Honor info for this event
  honor?: {
    id: string;
    status: string;
    amount: number;
  } | null;
}

// Get all events assigned to the current referee
export function useRefereeEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referee-events", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // First get assignments with event data
      const { data: assignments, error } = await supabase
        .from("event_assignments")
        .select(`
          id,
          event_id,
          referee_id,
          role,
          status,
          created_at,
          updated_at,
          event:event_id (
            id,
            name,
            date,
            location,
            status,
            category,
            kabupaten_kota:kabupaten_kota_id (id, name)
          )
        `)
        .eq("referee_id", user.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get honors for this referee to map them to events
      const { data: honors } = await supabase
        .from("honors")
        .select("id, event_id, status, amount")
        .eq("referee_id", user.id)
        .is("deleted_at", null);

      // Map honors to assignments
      const honorsByEventId = new Map(
        honors?.map(h => [h.event_id, { id: h.id, status: h.status, amount: h.amount }]) || []
      );

      const assignmentsWithHonors: RefereeEventAssignment[] = (assignments || []).map(a => ({
        ...a,
        role: a.role as "UTAMA" | "CADANGAN",
        status: a.status as "pending" | "confirmed" | "cancelled" | "declined",
        honor: a.event_id ? honorsByEventId.get(a.event_id) || null : null,
      }));

      return assignmentsWithHonors;
    },
    enabled: !!user?.id,
  });
}

// Get upcoming events (date >= today and event status is DISETUJUI)
export function useUpcomingRefereeEvents() {
  const { data: allEvents, ...rest } = useRefereeEvents();
  
  const today = new Date().toISOString().split("T")[0];
  
  const upcomingEvents = allEvents?.filter(assignment => 
    assignment.event?.date && 
    assignment.event.date >= today &&
    assignment.event.status === "DISETUJUI"
  ).sort((a, b) => 
    (a.event?.date || "").localeCompare(b.event?.date || "")
  );

  return { data: upcomingEvents, ...rest };
}

// Get past events (date < today or event status is SELESAI)
export function usePastRefereeEvents() {
  const { data: allEvents, ...rest } = useRefereeEvents();
  
  const today = new Date().toISOString().split("T")[0];
  
  const pastEvents = allEvents?.filter(assignment => 
    assignment.event?.date && 
    (assignment.event.date < today || assignment.event.status === "SELESAI")
  ).sort((a, b) => 
    (b.event?.date || "").localeCompare(a.event?.date || "")
  );

  return { data: pastEvents, ...rest };
}

// Get pending assignments that need confirmation
export function usePendingAssignments() {
  const { data: allEvents, ...rest } = useRefereeEvents();
  
  const today = new Date().toISOString().split("T")[0];
  
  const pendingAssignments = allEvents?.filter(assignment => 
    assignment.status === "pending" &&
    assignment.event?.date && 
    assignment.event.date >= today &&
    assignment.event.status === "DISETUJUI"
  );

  return { data: pendingAssignments, ...rest };
}
