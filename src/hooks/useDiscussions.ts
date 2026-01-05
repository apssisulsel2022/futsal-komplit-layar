import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  category: string;
  law_reference: number | null;
  author_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

export interface DiscussionReply {
  id: string;
  topic_id: string;
  parent_reply_id: string | null;
  author_id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

export const DISCUSSION_CATEGORIES = [
  { value: "lotg", label: "Laws of the Game" },
  { value: "interpretation", label: "Interpretasi Aturan" },
  { value: "case_study", label: "Studi Kasus" },
  { value: "general", label: "Diskusi Umum" },
];

export const getCategoryLabel = (category: string) => {
  const found = DISCUSSION_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case "lotg":
      return "bg-blue-500/10 text-blue-600";
    case "interpretation":
      return "bg-purple-500/10 text-purple-600";
    case "case_study":
      return "bg-orange-500/10 text-orange-600";
    case "general":
      return "bg-gray-500/10 text-gray-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const useDiscussionTopics = (filters?: {
  category?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["discussion-topics", filters],
    queryFn: async () => {
      let query = supabase
        .from("discussion_topics")
        .select(
          `
          *,
          author:profiles!discussion_topics_author_id_fkey(id, full_name, profile_photo_url)
        `
        )
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DiscussionTopic[];
    },
  });
};

export const useDiscussionTopic = (id: string) => {
  const queryClient = useQueryClient();

  // Increment view count on load
  useEffect(() => {
    if (id) {
      supabase.rpc("increment_view_count" as never, { topic_id: id } as never).then();
    }
  }, [id]);

  return useQuery({
    queryKey: ["discussion-topic", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discussion_topics")
        .select(
          `
          *,
          author:profiles!discussion_topics_author_id_fkey(id, full_name, profile_photo_url)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as DiscussionTopic;
    },
    enabled: !!id,
  });
};

export const useDiscussionReplies = (topicId: string) => {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    if (!topicId) return;

    const channel = supabase
      .channel(`replies-${topicId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "discussion_replies",
          filter: `topic_id=eq.${topicId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["discussion-replies", topicId],
          });
          queryClient.invalidateQueries({
            queryKey: ["discussion-topic", topicId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [topicId, queryClient]);

  return useQuery({
    queryKey: ["discussion-replies", topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discussion_replies")
        .select(
          `
          *,
          author:profiles!discussion_replies_author_id_fkey(id, full_name, profile_photo_url)
        `
        )
        .eq("topic_id", topicId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as DiscussionReply[];
    },
    enabled: !!topicId,
  });
};

export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      category: string;
      law_reference?: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: topic, error } = await supabase
        .from("discussion_topics")
        .insert({
          ...data,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return topic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      topic_id: string;
      content: string;
      parent_reply_id?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: reply, error } = await supabase
        .from("discussion_replies")
        .insert({
          ...data,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return reply;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-replies", variables.topic_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["discussion-topic", variables.topic_id],
      });
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from("discussion_topics")
        .delete()
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useDeleteReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      replyId,
      topicId,
    }: {
      replyId: string;
      topicId: string;
    }) => {
      const { error } = await supabase
        .from("discussion_replies")
        .delete()
        .eq("id", replyId);

      if (error) throw error;
      return topicId;
    },
    onSuccess: (topicId) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-replies", topicId],
      });
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useTogglePinTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      isPinned,
    }: {
      topicId: string;
      isPinned: boolean;
    }) => {
      const { error } = await supabase
        .from("discussion_topics")
        .update({ is_pinned: isPinned })
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useToggleLockTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topicId,
      isLocked,
    }: {
      topicId: string;
      isLocked: boolean;
    }) => {
      const { error } = await supabase
        .from("discussion_topics")
        .update({ is_locked: isLocked })
        .eq("id", topicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussion-topics"] });
    },
  });
};

export const useMarkAsSolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      replyId,
      topicId,
      isSolution,
    }: {
      replyId: string;
      topicId: string;
      isSolution: boolean;
    }) => {
      const { error } = await supabase
        .from("discussion_replies")
        .update({ is_solution: isSolution })
        .eq("id", replyId);

      if (error) throw error;
      return topicId;
    },
    onSuccess: (topicId) => {
      queryClient.invalidateQueries({
        queryKey: ["discussion-replies", topicId],
      });
    },
  });
};
