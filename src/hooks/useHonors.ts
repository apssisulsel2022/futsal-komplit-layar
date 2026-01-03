import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type HonorStatus = "draft" | "submitted" | "verified" | "rejected";

export interface Honor {
  id: string;
  referee_id: string;
  event_id: string | null;
  amount: number;
  notes: string | null;
  status: HonorStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  events?: {
    id: string;
    name: string;
    date: string;
    category: string | null;
  } | null;
  referee?: {
    id: string;
    full_name: string;
  } | null;
  verifier?: {
    id: string;
    full_name: string;
  } | null;
}

export interface HonorStatistics {
  referee_id: string;
  total_verified: number;
  total_pending: number;
  total_rejected: number;
  total_earned: number;
  pending_amount: number;
}

// Get honors (auto-filters based on role)
export function useHonors(filters?: { status?: HonorStatus; refereeId?: string }) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["honors", user?.id, isAdmin(), filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("honors")
        .select(`
          *,
          events (id, name, date, category)
        `)
        .order("created_at", { ascending: false });

      // Non-admins only see their own honors
      if (!isAdmin()) {
        query = query.eq("referee_id", user.id);
      } else if (filters?.refereeId) {
        query = query.eq("referee_id", filters.refereeId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // For admin, fetch referee profiles
      if (isAdmin() && data.length > 0) {
        const refereeIds = [...new Set(data.map(h => h.referee_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", refereeIds);
        
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        
        return data.map(honor => ({
          ...honor,
          referee: profileMap.get(honor.referee_id) || null,
        })) as Honor[];
      }

      return data as Honor[];
    },
    enabled: !!user,
  });
}

// Get honor statistics for a referee
export function useHonorStatistics(refereeId?: string) {
  const { user, isAdmin } = useAuth();
  const targetId = refereeId || user?.id;

  return useQuery({
    queryKey: ["honor-statistics", targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_honor_statistics", { _referee_id: targetId });

      if (error) throw error;
      return (data?.[0] as HonorStatistics) || {
        referee_id: targetId,
        total_verified: 0,
        total_pending: 0,
        total_rejected: 0,
        total_earned: 0,
        pending_amount: 0,
      };
    },
    enabled: !!targetId,
  });
}

// Get eligible events for honor submission (assigned and completed)
export function useEligibleEventsForHonor() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["eligible-events-honor", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get assigned events
      const { data: assignments, error: assignError } = await supabase
        .from("event_assignments")
        .select(`
          event:event_id (id, name, date, status, category)
        `)
        .eq("referee_id", user.id)
        .neq("status", "cancelled");

      if (assignError) throw assignError;

      // Get existing honors to exclude
      const { data: existingHonors } = await supabase
        .from("honors")
        .select("event_id")
        .eq("referee_id", user.id);

      const existingEventIds = new Set(existingHonors?.map(h => h.event_id) || []);

      // Filter to only completed events without existing honors
      const eligibleEvents = (assignments || [])
        .filter(a => a.event && a.event.status === "SELESAI" && !existingEventIds.has(a.event.id))
        .map(a => a.event!);

      return eligibleEvents;
    },
    enabled: !!user,
  });
}

// Create honor (by referee)
export function useCreateHonor() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (honor: {
      event_id: string | null;
      amount: number;
      notes?: string;
      status?: "draft" | "submitted";
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("honors")
        .insert({
          ...honor,
          referee_id: user.id,
          status: honor.status || "draft",
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("tidak ditugaskan")) {
          throw new Error("Anda tidak ditugaskan ke event ini");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-events-honor"] });
      toast.success("Honor berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan honor: " + error.message);
    },
  });
}

// Update honor draft (by referee - only draft status)
export function useUpdateHonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount?: number; notes?: string }) => {
      const updates: Record<string, unknown> = {};
      if (amount !== undefined) updates.amount = amount;
      if (notes !== undefined) updates.notes = notes;

      const { data, error } = await supabase
        .from("honors")
        .update(updates)
        .eq("id", id)
        .eq("status", "draft") // Only allow updating drafts
        .select()
        .single();

      if (error) {
        if (error.message.includes("tidak dapat mengubah")) {
          throw new Error("Tidak dapat mengubah honor yang sudah disubmit");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      toast.success("Honor berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui honor: " + error.message);
    },
  });
}

// Submit honor for verification (by referee)
export function useSubmitHonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await supabase
        .from("honors")
        .update({ status: "submitted" })
        .eq("id", id)
        .eq("status", "draft")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      toast.success("Honor berhasil diajukan untuk verifikasi");
    },
    onError: (error) => {
      toast.error("Gagal mengajukan honor: " + error.message);
    },
  });
}

// Verify honor (by admin)
export function useVerifyHonor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "verified" | "rejected"; notes?: string }) => {
      if (!user) throw new Error("User not authenticated");

      const updates: Record<string, unknown> = {
        status,
        verified_by: user.id,
      };
      if (notes) updates.notes = notes;

      const { data, error } = await supabase
        .from("honors")
        .update(updates)
        .eq("id", id)
        .eq("status", "submitted") // Only allow verifying submitted honors
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      queryClient.invalidateQueries({ queryKey: ["honor-statistics"] });
      toast.success(
        variables.status === "verified" 
          ? "Honor berhasil diverifikasi" 
          : "Honor ditolak"
      );
    },
    onError: (error) => {
      toast.error("Gagal memverifikasi honor: " + error.message);
    },
  });
}

// Delete draft honor (by referee)
export function useDeleteHonor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("honors")
        .delete()
        .eq("id", id)
        .eq("status", "draft")
        .eq("referee_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-events-honor"] });
      toast.success("Honor berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus honor: " + error.message);
    },
  });
}

// Legacy support
export function useHonorStats() {
  return useHonorStatistics();
}

// Helper functions
export function getHonorStatusDisplay(status: HonorStatus) {
  switch (status) {
    case "draft":
      return { label: "Draft", variant: "neutral" as const, color: "text-muted-foreground" };
    case "submitted":
      return { label: "Diajukan", variant: "warning" as const, color: "text-yellow-600" };
    case "verified":
      return { label: "Diverifikasi", variant: "success" as const, color: "text-green-600" };
    case "rejected":
      return { label: "Ditolak", variant: "error" as const, color: "text-red-600" };
    default:
      return { label: status, variant: "neutral" as const, color: "text-muted-foreground" };
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
