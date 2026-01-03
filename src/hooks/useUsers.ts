import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/contexts/AuthContext";

interface User {
  id: string;
  full_name: string;
  kabupaten_kota_id: string | null;
  is_profile_complete: boolean | null;
  created_at: string | null;
  kabupaten_kota?: {
    id: string;
    name: string;
  } | null;
  role?: AppRole | null;
  email?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
  kabupaten_kota_id?: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Fetch profiles with kabupaten_kota
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          kabupaten_kota_id,
          is_profile_complete,
          created_at,
          kabupaten_kota:kabupaten_kota_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles?.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role as AppRole | null,
        };
      });

      return usersWithRoles as User[];
    },
  });
}

export function useKabupatenKota() {
  return useQuery({
    queryKey: ["kabupaten_kota"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kabupaten_kota")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("create-user", {
        body: userData,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserKabupatenKota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, kabupatenKotaId }: { userId: string; kabupatenKotaId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ kabupaten_kota_id: kabupatenKotaId })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
