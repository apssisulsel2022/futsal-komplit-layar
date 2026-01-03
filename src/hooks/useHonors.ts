import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Honor {
  id: string;
  referee_id: string;
  event_id: string | null;
  amount: number;
  notes: string | null;
  status: "draft" | "submitted" | "verified" | "rejected";
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
}

export function useHonors() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["honors", user?.id, isAdmin()],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("honors")
        .select(`
          *,
          events (
            id,
            name,
            date,
            category
          )
        `)
        .order("created_at", { ascending: false });

      // Non-admins only see their own honors
      if (!isAdmin()) {
        query = query.eq("referee_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Honor[];
    },
    enabled: !!user,
  });
}

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

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors", user?.id, isAdmin()] });
      toast.success("Honor berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan honor: " + error.message);
    },
  });
}

export function useUpdateHonor() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Honor> & { id: string }) => {
      const { data, error } = await supabase
        .from("honors")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors", user?.id, isAdmin()] });
      toast.success("Honor berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui honor: " + error.message);
    },
  });
}

export function useVerifyHonor() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "rejected" }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("honors")
        .update({
          status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["honors", user?.id, isAdmin()] });
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

export function useDeleteHonor() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("honors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honors", user?.id, isAdmin()] });
      toast.success("Honor berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus honor: " + error.message);
    },
  });
}

export function useHonorStats() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["honor-stats", user?.id, isAdmin()],
    queryFn: async () => {
      if (!user) return { verified: 0, pending: 0, total: 0 };

      let query = supabase.from("honors").select("amount, status");
      
      if (!isAdmin()) {
        query = query.eq("referee_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, honor) => {
          if (honor.status === "verified") {
            acc.verified += honor.amount;
          } else if (honor.status === "submitted") {
            acc.pending += honor.amount;
          }
          acc.total += honor.amount;
          return acc;
        },
        { verified: 0, pending: 0, total: 0 }
      );

      return stats;
    },
    enabled: !!user,
  });
}
