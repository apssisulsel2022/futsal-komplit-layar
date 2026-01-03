import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EventStatus = "DIAJUKAN" | "DISETUJUI" | "DITOLAK" | "SELESAI";

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string | null;
  category: string | null;
  status: EventStatus;
  description: string | null;
  created_by: string | null;
  kabupaten_kota_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: {
    id: string;
    full_name: string;
  } | null;
  kabupaten_kota?: {
    id: string;
    name: string;
  } | null;
}

export interface EventApproval {
  id: string;
  event_id: string;
  action: "SUBMIT" | "APPROVE" | "REJECT" | "COMPLETE" | "REVISION_REQUEST";
  from_status: string | null;
  to_status: string;
  notes: string | null;
  approved_by: string | null;
  created_at: string;
  // Joined data
  approver?: {
    id: string;
    full_name: string;
  } | null;
}

export function useEvents(filters?: { status?: EventStatus; kabupatenKotaId?: string }) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          *,
          creator:created_by (id, full_name),
          kabupaten_kota:kabupaten_kota_id (id, name)
        `)
        .order("date", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.kabupatenKotaId) {
        query = query.eq("kabupaten_kota_id", filters.kabupatenKotaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:created_by (id, full_name),
          kabupaten_kota:kabupaten_kota_id (id, name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!id,
  });
}

export function useEventApprovals(eventId: string) {
  return useQuery({
    queryKey: ["event-approvals", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_approvals")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch approver profiles
      const approverIds = data.filter(a => a.approved_by).map(a => a.approved_by);
      let approvers: { id: string; full_name: string }[] = [];
      
      if (approverIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", approverIds as string[]);
        approvers = profiles || [];
      }

      const approverMap = new Map(approvers.map(a => [a.id, a]));

      return data.map(approval => ({
        ...approval,
        approver: approval.approved_by ? approverMap.get(approval.approved_by) || null : null,
      })) as EventApproval[];
    },
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: {
      name: string;
      date: string;
      location?: string;
      category?: string;
      description?: string;
      kabupaten_kota_id?: string;
      created_by?: string;
    }) => {
      // Create event with DIAJUKAN status
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert({
          ...event,
          status: "DIAJUKAN",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create initial approval record
      const { error: approvalError } = await supabase
        .from("event_approvals")
        .insert({
          event_id: eventData.id,
          action: "SUBMIT",
          from_status: null,
          to_status: "DIAJUKAN",
          approved_by: event.created_by,
          notes: "Event diajukan",
        });

      if (approvalError) {
        console.error("Failed to create approval record:", approvalError);
      }

      return eventData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event berhasil diajukan");
    },
    onError: (error) => {
      toast.error("Gagal mengajukan event: " + error.message);
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Event> & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", data.id] });
      toast.success("Event berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui event: " + error.message);
    },
  });
}

export function useApproveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, notes, userId }: { eventId: string; notes?: string; userId: string }) => {
      // Get current event status
      const { data: event } = await supabase
        .from("events")
        .select("status")
        .eq("id", eventId)
        .single();

      if (!event) throw new Error("Event tidak ditemukan");

      // Update event status
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "DISETUJUI" })
        .eq("id", eventId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from("event_approvals")
        .insert({
          event_id: eventId,
          action: "APPROVE",
          from_status: event.status,
          to_status: "DISETUJUI",
          approved_by: userId,
          notes: notes || "Event disetujui",
        });

      if (approvalError) throw approvalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-approvals"] });
      toast.success("Event berhasil disetujui");
    },
    onError: (error) => {
      toast.error("Gagal menyetujui event: " + error.message);
    },
  });
}

export function useRejectEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, notes, userId }: { eventId: string; notes: string; userId: string }) => {
      // Get current event status
      const { data: event } = await supabase
        .from("events")
        .select("status")
        .eq("id", eventId)
        .single();

      if (!event) throw new Error("Event tidak ditemukan");

      // Update event status
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "DITOLAK" })
        .eq("id", eventId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from("event_approvals")
        .insert({
          event_id: eventId,
          action: "REJECT",
          from_status: event.status,
          to_status: "DITOLAK",
          approved_by: userId,
          notes,
        });

      if (approvalError) throw approvalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-approvals"] });
      toast.success("Event ditolak");
    },
    onError: (error) => {
      toast.error("Gagal menolak event: " + error.message);
    },
  });
}

export function useCompleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, notes, userId }: { eventId: string; notes?: string; userId: string }) => {
      // Get current event status
      const { data: event } = await supabase
        .from("events")
        .select("status")
        .eq("id", eventId)
        .single();

      if (!event) throw new Error("Event tidak ditemukan");
      if (event.status !== "DISETUJUI") throw new Error("Hanya event yang disetujui yang bisa diselesaikan");

      // Update event status
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "SELESAI" })
        .eq("id", eventId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from("event_approvals")
        .insert({
          event_id: eventId,
          action: "COMPLETE",
          from_status: event.status,
          to_status: "SELESAI",
          approved_by: userId,
          notes: notes || "Event selesai",
        });

      if (approvalError) throw approvalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-approvals"] });
      toast.success("Event ditandai selesai");
    },
    onError: (error) => {
      toast.error("Gagal menyelesaikan event: " + error.message);
    },
  });
}

// Helper function to get status display
export function getEventStatusDisplay(status: EventStatus) {
  switch (status) {
    case "DIAJUKAN":
      return { label: "Diajukan", variant: "warning" as const, color: "text-yellow-600" };
    case "DISETUJUI":
      return { label: "Disetujui", variant: "success" as const, color: "text-green-600" };
    case "DITOLAK":
      return { label: "Ditolak", variant: "error" as const, color: "text-red-600" };
    case "SELESAI":
      return { label: "Selesai", variant: "neutral" as const, color: "text-gray-600" };
    default:
      return { label: status, variant: "neutral" as const, color: "text-gray-600" };
  }
}
