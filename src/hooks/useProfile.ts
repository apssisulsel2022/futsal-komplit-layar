import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: string;
  full_name: string;
  birth_date: string | null;
  afk_origin: string | null;
  occupation: string | null;
  license_level: string | null;
  profile_photo_url: string | null;
  license_photo_url: string | null;
  ktp_photo_url: string | null;
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      refreshProfile();
      toast.success("Profil berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui profil: " + error.message);
    },
  });
}

export async function uploadProfileImage(
  userId: string,
  file: File,
  bucket: "avatars" | "documents",
  type: "profile" | "license" | "ktp"
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  
  return data.publicUrl;
}
