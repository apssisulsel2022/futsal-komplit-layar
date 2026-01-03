import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./useProfile";

export function useReferees() {
  return useQuery({
    queryKey: ["referees"],
    queryFn: async () => {
      // Get all users with referee role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "referee");

      if (roleError) throw roleError;

      const refereeIds = roleData.map((r) => r.user_id);

      if (refereeIds.length === 0) return [];

      // Get profiles for those users
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", refereeIds)
        .order("full_name");

      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useReferee(id: string) {
  return useQuery({
    queryKey: ["referees", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!id,
  });
}
