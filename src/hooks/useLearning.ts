import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LearningMaterial {
  id: string;
  title: string;
  description: string | null;
  category: string;
  law_number: number | null;
  content: string;
  video_url: string | null;
  pdf_url: string | null;
  difficulty_level: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  material_id: string;
  is_completed: boolean;
  completed_at: string | null;
}

// LOTG Categories mapping
export const LOTG_CATEGORIES = [
  { law: 1, category: "law_1_pitch", title: "Lapangan Permainan" },
  { law: 2, category: "law_2_ball", title: "Bola" },
  { law: 3, category: "law_3_players", title: "Pemain" },
  { law: 4, category: "law_4_equipment", title: "Perlengkapan Pemain" },
  { law: 5, category: "law_5_referees", title: "Wasit" },
  { law: 6, category: "law_6_officials", title: "Petugas Pertandingan" },
  { law: 7, category: "law_7_duration", title: "Durasi Pertandingan" },
  { law: 8, category: "law_8_start", title: "Memulai Pertandingan" },
  { law: 9, category: "law_9_ball_play", title: "Bola Dalam/Luar" },
  { law: 10, category: "law_10_goal", title: "Gol" },
  { law: 11, category: "law_11_accumulated", title: "Pelanggaran Terakumulasi" },
  { law: 12, category: "law_12_fouls", title: "Pelanggaran" },
  { law: 13, category: "law_13_free_kicks", title: "Tendangan Bebas" },
  { law: 14, category: "law_14_penalty", title: "Tendangan Penalti" },
  { law: 15, category: "law_15_kick_in", title: "Tendangan Ke Dalam" },
  { law: 16, category: "law_16_goal_clearance", title: "Goal Clearance" },
  { law: 17, category: "law_17_corner", title: "Tendangan Sudut" },
];

export const getCategoryLabel = (category: string) => {
  const found = LOTG_CATEGORIES.find((c) => c.category === category);
  return found ? `Law ${found.law}: ${found.title}` : category;
};

export const getDifficultyLabel = (level: string) => {
  switch (level) {
    case "basic":
      return "Dasar";
    case "intermediate":
      return "Menengah";
    case "advanced":
      return "Lanjutan";
    default:
      return level;
  }
};

export const getDifficultyColor = (level: string) => {
  switch (level) {
    case "basic":
      return "bg-green-500/10 text-green-600";
    case "intermediate":
      return "bg-yellow-500/10 text-yellow-600";
    case "advanced":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const useLearningMaterials = (filters?: {
  category?: string;
  difficulty?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["learning-materials", filters],
    queryFn: async () => {
      let query = supabase
        .from("learning_materials")
        .select("*")
        .eq("is_published", true)
        .order("law_number", { ascending: true })
        .order("sort_order", { ascending: true });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq("difficulty_level", filters.difficulty);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LearningMaterial[];
    },
  });
};

export const useLearningMaterial = (id: string) => {
  return useQuery({
    queryKey: ["learning-material", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_materials")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as LearningMaterial;
    },
    enabled: !!id,
  });
};

export const useLearningProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["learning-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("learning_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as LearningProgress[];
    },
    enabled: !!user?.id,
  });
};

export const useMarkComplete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (materialId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("learning_progress")
        .upsert(
          {
            user_id: user.id,
            material_id: materialId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,material_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-progress"] });
    },
  });
};

export const useMarkIncomplete = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (materialId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("learning_progress")
        .update({
          is_completed: false,
          completed_at: null,
        })
        .eq("user_id", user.id)
        .eq("material_id", materialId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-progress"] });
    },
  });
};
