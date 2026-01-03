import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  sort_order: number;
}

export interface Evaluation {
  id: string;
  event_id: string;
  referee_id: string;
  evaluator_id: string;
  total_score: number | null;
  status: "draft" | "submitted" | "reviewed";
  notes: string | null;
  created_at: string;
  submitted_at: string | null;
  event?: {
    id: string;
    name: string;
    date: string;
    location: string | null;
  };
  referee?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
  evaluator?: {
    id: string;
    full_name: string;
  };
}

export interface EvaluationScore {
  id: string;
  evaluation_id: string;
  criteria_id: string;
  score: number;
  notes: string | null;
  criteria?: EvaluationCriteria;
}

export function useEvaluationCriteria() {
  return useQuery({
    queryKey: ["evaluation-criteria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as EvaluationCriteria[];
    },
  });
}

export function useEvaluations(status?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["evaluations", status],
    queryFn: async () => {
      let query = supabase
        .from("evaluations")
        .select(`
          *,
          event:events(id, name, date, location),
          referee:profiles!evaluations_referee_id_fkey(id, full_name, profile_photo_url),
          evaluator:profiles!evaluations_evaluator_id_fkey(id, full_name)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Evaluation[];
    },
    enabled: !!user,
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: ["evaluation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          event:events(id, name, date, location),
          referee:profiles!evaluations_referee_id_fkey(id, full_name, profile_photo_url),
          evaluator:profiles!evaluations_evaluator_id_fkey(id, full_name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Evaluation | null;
    },
    enabled: !!id,
  });
}

export function useEvaluationScores(evaluationId: string) {
  return useQuery({
    queryKey: ["evaluation-scores", evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_scores")
        .select(`
          *,
          criteria:evaluation_criteria(*)
        `)
        .eq("evaluation_id", evaluationId);

      if (error) throw error;
      return data as EvaluationScore[];
    },
    enabled: !!evaluationId,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      event_id: string;
      referee_id: string;
      evaluator_id: string;
    }) => {
      const { data: evaluation, error } = await supabase
        .from("evaluations")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

export function useSaveEvaluationScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evaluationId,
      scores,
    }: {
      evaluationId: string;
      scores: { criteria_id: string; score: number; notes?: string }[];
    }) => {
      // Upsert scores
      const { error } = await supabase
        .from("evaluation_scores")
        .upsert(
          scores.map((s) => ({
            evaluation_id: evaluationId,
            criteria_id: s.criteria_id,
            score: s.score,
            notes: s.notes || null,
          })),
          { onConflict: "evaluation_id,criteria_id" }
        );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["evaluation-scores", variables.evaluationId],
      });
    },
  });
}

export function useSubmitEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evaluationId,
      totalScore,
      notes,
    }: {
      evaluationId: string;
      totalScore: number;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("evaluations")
        .update({
          status: "submitted",
          total_score: totalScore,
          notes: notes || null,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", evaluationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}

// Get events that can be evaluated (completed events with assigned referees)
export function useEvaluatableEvents() {
  return useQuery({
    queryKey: ["evaluatable-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          name,
          date,
          location,
          event_assignments(
            id,
            referee_id,
            status,
            referee:profiles(id, full_name, profile_photo_url)
          )
        `)
        .eq("status", "SELESAI")
        .eq("event_assignments.status", "confirmed")
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
