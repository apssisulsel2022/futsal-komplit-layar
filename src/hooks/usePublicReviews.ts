import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RefereeWithStats {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  license_level: string | null;
  afk_origin: string | null;
  avg_rating: number;
  total_reviews: number;
}

interface Review {
  id: string;
  referee_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function usePublicReferees(search?: string, afkFilter?: string) {
  return useQuery({
    queryKey: ["public-referees", search, afkFilter],
    queryFn: async (): Promise<RefereeWithStats[]> => {
      // First get user IDs with 'wasit' role
      const { data: refereeRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "wasit");

      if (rolesError) throw rolesError;

      const refereeIds = refereeRoles?.map((r) => r.user_id) || [];

      if (refereeIds.length === 0) {
        return [];
      }

      // Get profiles for referees only
      let profilesQuery = supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url, license_level, afk_origin")
        .eq("is_profile_complete", true)
        .in("id", refereeIds);

      if (search) {
        profilesQuery = profilesQuery.ilike("full_name", `%${search}%`);
      }

      if (afkFilter) {
        profilesQuery = profilesQuery.eq("afk_origin", afkFilter);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;

      // Get review stats
      const { data: stats, error: statsError } = await supabase
        .from("referee_review_stats")
        .select("*");

      if (statsError) throw statsError;

      // Merge profiles with stats
      const statsMap = new Map(stats?.map((s) => [s.referee_id, s]) || []);

      return (profiles || []).map((profile) => {
        const stat = statsMap.get(profile.id);
        return {
          ...profile,
          avg_rating: stat?.avg_rating ? Number(stat.avg_rating) : 0,
          total_reviews: stat?.total_reviews || 0,
        };
      });
    },
  });
}

export function useRefereeForReview(id: string) {
  return useQuery({
    queryKey: ["referee-for-review", id],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url, license_level, afk_origin")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;

      const { data: stats } = await supabase
        .from("referee_review_stats")
        .select("*")
        .eq("referee_id", id)
        .maybeSingle();

      return {
        ...profile,
        avg_rating: stats?.avg_rating ? Number(stats.avg_rating) : 0,
        total_reviews: stats?.total_reviews || 0,
      };
    },
    enabled: !!id,
  });
}

export function useRefereeReviews(refereeId: string) {
  return useQuery({
    queryKey: ["referee-reviews", refereeId],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("referee_reviews")
        .select("*")
        .eq("referee_id", refereeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!refereeId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      refereeId,
      rating,
      reviewerName,
      comment,
    }: {
      refereeId: string;
      rating: number;
      reviewerName?: string;
      comment?: string;
    }) => {
      const { data, error } = await supabase
        .from("referee_reviews")
        .insert({
          referee_id: refereeId,
          rating,
          reviewer_name: reviewerName || null,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["public-referees"] });
      queryClient.invalidateQueries({
        queryKey: ["referee-for-review", variables.refereeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["referee-reviews", variables.refereeId],
      });
    },
  });
}

export function useAfkOrigins() {
  return useQuery({
    queryKey: ["afk-origins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("afk_origin")
        .eq("is_profile_complete", true)
        .not("afk_origin", "is", null);

      if (error) throw error;

      // Get unique values
      const uniqueOrigins = [
        ...new Set(data?.map((d) => d.afk_origin).filter(Boolean)),
      ] as string[];

      return uniqueOrigins.sort();
    },
  });
}
