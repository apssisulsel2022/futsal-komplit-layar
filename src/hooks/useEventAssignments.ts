import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type RefereeRole = "UTAMA" | "CADANGAN";
export type AssignmentStatus = "pending" | "confirmed" | "cancelled" | "declined";

export interface EventAssignment {
  id: string;
  event_id: string;
  referee_id: string;
  role: RefereeRole;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  referee?: {
    id: string;
    full_name: string;
    license_level: string | null;
    profile_photo_url: string | null;
    kabupaten_kota?: {
      id: string;
      name: string;
    } | null;
  } | null;
  event?: {
    id: string;
    name: string;
    date: string;
    status: string;
  } | null;
}

export interface AvailableReferee {
  id: string;
  full_name: string;
  license_level: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  has_conflict: boolean;
}

// Get assignments for a specific event
export function useEventAssignments(eventId: string) {
  return useQuery({
    queryKey: ["event-assignments", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_assignments")
        .select(`
          *,
          referee:referee_id (
            id,
            full_name,
            license_level,
            profile_photo_url,
            kabupaten_kota:kabupaten_kota_id (id, name)
          )
        `)
        .eq("event_id", eventId)
        .neq("status", "cancelled")
        .order("role", { ascending: true });

      if (error) throw error;
      return data as EventAssignment[];
    },
    enabled: !!eventId,
  });
}

// Get available referees for assignment (active wasit without conflicts)
export function useAvailableReferees(eventId: string) {
  return useQuery({
    queryKey: ["available-referees", eventId],
    queryFn: async () => {
      // Get event date first
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("date, status")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      if (!event) throw new Error("Event tidak ditemukan");
      if (event.status !== "DISETUJUI") {
        throw new Error("Hanya event yang disetujui yang bisa ditugaskan wasit");
      }

      // Get all active referees (wasit role)
      const { data: referees, error: refError } = await supabase
        .rpc("get_referees", { _is_active: true });

      if (refError) throw refError;

      // Get existing assignments for this event date (excluding cancelled)
      const { data: conflictingAssignments, error: conflictError } = await supabase
        .from("event_assignments")
        .select(`
          referee_id,
          event:event_id (date)
        `)
        .neq("status", "cancelled");

      if (conflictError) throw conflictError;

      // Find referees with conflicts on the same date
      const refereesWithConflicts = new Set(
        conflictingAssignments
          ?.filter(a => a.event?.date === event.date)
          .map(a => a.referee_id) || []
      );

      // Get already assigned referees for this event
      const { data: existingAssignments } = await supabase
        .from("event_assignments")
        .select("referee_id")
        .eq("event_id", eventId)
        .neq("status", "cancelled");

      const assignedRefereeIds = new Set(existingAssignments?.map(a => a.referee_id) || []);

      // Filter out already assigned referees and mark conflicts
      const availableReferees: AvailableReferee[] = (referees || [])
        .filter(r => !assignedRefereeIds.has(r.id))
        .map(r => ({
          id: r.id,
          full_name: r.full_name,
          license_level: r.license_level,
          profile_photo_url: r.profile_photo_url,
          is_active: r.is_active,
          kabupaten_kota_id: r.kabupaten_kota_id,
          kabupaten_kota_name: r.kabupaten_kota_name,
          has_conflict: refereesWithConflicts.has(r.id),
        }));

      return availableReferees;
    },
    enabled: !!eventId,
  });
}

// Get referee's assignments
export function useRefereeAssignments(refereeId: string) {
  return useQuery({
    queryKey: ["referee-assignments", refereeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_assignments")
        .select(`
          *,
          event:event_id (
            id,
            name,
            date,
            status,
            location,
            kabupaten_kota:kabupaten_kota_id (id, name)
          )
        `)
        .eq("referee_id", refereeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!refereeId,
  });
}

// Assign referee to event
export function useAssignReferee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      refereeId,
      role = "CADANGAN",
    }: {
      eventId: string;
      refereeId: string;
      role?: RefereeRole;
    }) => {
      const { data, error } = await supabase
        .from("event_assignments")
        .insert({
          event_id: eventId,
          referee_id: refereeId,
          role,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        // Parse trigger error messages
        if (error.message.includes("unapproved event")) {
          throw new Error("Event belum disetujui");
        }
        if (error.message.includes("inactive referee")) {
          throw new Error("Wasit tidak aktif");
        }
        if (error.message.includes("schedule conflict")) {
          throw new Error("Wasit sudah bertugas di event lain pada tanggal yang sama");
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-assignments", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", variables.refereeId] });
      toast.success("Wasit berhasil ditugaskan");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menugaskan wasit");
    },
  });
}

// Update assignment (role or status)
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      role,
      status,
    }: {
      assignmentId: string;
      role?: RefereeRole;
      status?: AssignmentStatus;
    }) => {
      const updates: Record<string, unknown> = {};
      if (role) updates.role = role;
      if (status) updates.status = status;

      const { data, error } = await supabase
        .from("event_assignments")
        .update(updates)
        .eq("id", assignmentId)
        .select(`*, event_id, referee_id`)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-assignments", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", data.referee_id] });
      toast.success("Penugasan berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui penugasan: " + error.message);
    },
  });
}

// Remove assignment (set status to cancelled)
export function useRemoveAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => {
      const { data, error } = await supabase
        .from("event_assignments")
        .update({ status: "cancelled" })
        .eq("id", assignmentId)
        .select(`*, event_id, referee_id`)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-assignments", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["available-referees", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments", data.referee_id] });
      toast.success("Penugasan wasit dibatalkan");
    },
    onError: (error) => {
      toast.error("Gagal membatalkan penugasan: " + error.message);
    },
  });
}

// Confirm or decline assignment (for referees)
export function useConfirmAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      confirm,
    }: {
      assignmentId: string;
      confirm: boolean;
    }) => {
      // Verify the assignment belongs to current user
      const { data: assignment, error: fetchError } = await supabase
        .from("event_assignments")
        .select("*, event:event_id (date, status)")
        .eq("id", assignmentId)
        .eq("referee_id", user?.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!assignment) {
        throw new Error("Penugasan tidak ditemukan atau Anda tidak memiliki akses");
      }

      // Check if event hasn't started yet
      const eventDate = new Date(assignment.event?.date || "");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        throw new Error("Tidak dapat mengubah status untuk event yang sudah lewat");
      }

      // Update the assignment status
      const newStatus = confirm ? "confirmed" : "declined";
      const { data, error } = await supabase
        .from("event_assignments")
        .update({ status: newStatus })
        .eq("id", assignmentId)
        .eq("referee_id", user?.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("Gagal mengupdate penugasan. Pastikan Anda memiliki akses.");
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["referee-events"] });
      queryClient.invalidateQueries({ queryKey: ["event-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["referee-assignments"] });
      toast.success(
        variables.confirm 
          ? "Penugasan berhasil dikonfirmasi" 
          : "Penugasan berhasil ditolak"
      );
    },
    onError: (error) => {
      toast.error(error.message || "Gagal mengubah status penugasan");
    },
  });
}

// Helper functions
export function getRoleBadgeVariant(role: RefereeRole): "primary" | "info" {
  return role === "UTAMA" ? "primary" : "info";
}

export function getStatusBadgeVariant(status: AssignmentStatus) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "cancelled":
    case "declined":
      return "error" as const;
    default:
      return "warning" as const;
  }
}
