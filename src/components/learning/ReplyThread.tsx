import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Reply,
  MoreVertical,
  Trash2,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  DiscussionReply,
  useCreateReply,
  useDeleteReply,
  useMarkAsSolution,
} from "@/hooks/useDiscussions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReplyThreadProps {
  reply: DiscussionReply;
  topicId: string;
  topicAuthorId: string;
  isTopicLocked: boolean;
  allReplies: DiscussionReply[];
  level?: number;
}

export const ReplyThread = ({
  reply,
  topicId,
  topicAuthorId,
  isTopicLocked,
  allReplies,
  level = 0,
}: ReplyThreadProps) => {
  const { user, isAdmin } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const createReply = useCreateReply();
  const deleteReply = useDeleteReply();
  const markAsSolution = useMarkAsSolution();

  const authorName = reply.author?.full_name || "Anonim";
  const authorInitials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isAuthor = user?.id === reply.author_id;
  const isTopicOwner = user?.id === topicAuthorId;
  const canDelete = isAuthor || isAdmin();
  const canMarkSolution = isTopicOwner || isAdmin();
  const childReplies = allReplies.filter((r) => r.parent_reply_id === reply.id);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await createReply.mutateAsync({
        topic_id: topicId,
        content: replyContent,
        parent_reply_id: reply.id,
      });
      setReplyContent("");
      setIsReplying(false);
      toast.success("Balasan berhasil dikirim");
    } catch {
      toast.error("Gagal mengirim balasan");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReply.mutateAsync({ replyId: reply.id, topicId });
      toast.success("Balasan berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus balasan");
    }
  };

  const handleMarkSolution = async () => {
    try {
      await markAsSolution.mutateAsync({
        replyId: reply.id,
        topicId,
        isSolution: !reply.is_solution,
      });
      toast.success(
        reply.is_solution ? "Tanda solusi dihapus" : "Ditandai sebagai solusi"
      );
    } catch {
      toast.error("Gagal mengubah status solusi");
    }
  };

  return (
    <div className={cn("relative", level > 0 && "ml-6 md:ml-10")}>
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border -ml-3 md:-ml-5" />
      )}
      <div
        className={cn(
          "rounded-lg p-4",
          reply.is_solution
            ? "bg-green-500/10 border border-green-500/30"
            : "bg-muted/30"
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={reply.author?.profile_photo_url || undefined} />
            <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{authorName}</span>
                {reply.is_solution && (
                  <Badge className="bg-green-500/10 text-green-600 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Solusi
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.created_at), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </span>
              </div>
              {(canDelete || canMarkSolution) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canMarkSolution && (
                      <DropdownMenuItem onClick={handleMarkSolution}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {reply.is_solution ? "Hapus tanda solusi" : "Tandai sebagai solusi"}
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-sm mt-2 whitespace-pre-wrap">{reply.content}</p>
            {!isTopicLocked && level < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 mt-2 text-xs"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                Balas
              </Button>
            )}
          </div>
        </div>

        {isReplying && (
          <div className="mt-3 ml-11">
            <Textarea
              placeholder="Tulis balasan..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || createReply.isPending}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Kirim
              </Button>
            </div>
          </div>
        )}
      </div>

      {childReplies.length > 0 && (
        <div className="mt-3 space-y-3">
          {childReplies.map((childReply) => (
            <ReplyThread
              key={childReply.id}
              reply={childReply}
              topicId={topicId}
              topicAuthorId={topicAuthorId}
              isTopicLocked={isTopicLocked}
              allReplies={allReplies}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
