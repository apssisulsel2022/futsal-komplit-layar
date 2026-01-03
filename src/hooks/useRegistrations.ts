import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PendingRegistration {
  id: string;
  full_name: string;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  requested_role: string | null;
  registration_status: string | null;
  created_at: string | null;
}

interface RegistrationHistory {
  id: string;
  full_name: string;
  kabupaten_kota_id: string | null;
  kabupaten_kota_name: string | null;
  requested_role: string | null;
  registration_status: string | null;
  rejected_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approver_name: string | null;
  created_at: string | null;
}

export function usePendingRegistrations() {
  return useQuery({
    queryKey: ["pending-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_registrations");

      if (error) throw error;
      return data as PendingRegistration[];
    },
  });
}

export function useRegistrationHistory() {
  return useQuery({
    queryKey: ["registration-history"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_registration_history");

      if (error) throw error;
      return data as RegistrationHistory[];
    },
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: ["pending-registrations-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_registrations");

      if (error) throw error;
      return data?.length || 0;
    },
  });
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "wasit" | "panitia" }) => {
      // 1. Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          registration_status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // 2. Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
      });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration-history"] });
      queryClient.invalidateQueries({ queryKey: ["pending-registrations-count"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // Update profile status to rejected with reason
      const { error } = await supabase
        .from("profiles")
        .update({
          registration_status: "rejected",
          rejected_reason: reason,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["registration-history"] });
      queryClient.invalidateQueries({ queryKey: ["pending-registrations-count"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
