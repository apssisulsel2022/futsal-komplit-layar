import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pin,
  Lock,
  Unlock,
  MoreVertical,
  Trash2,
  MessageSquare,
  Eye,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ReplyThread } from "@/components/learning/ReplyThread";
import {
  useDiscussionTopic,
  useDiscussionReplies,
  useCreateReply,
  useDeleteTopic,
  useTogglePinTopic,
  useToggleLockTopic,
  getCategoryLabel,
  getCategoryColor,
} from "@/hooks/useDiscussions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DiscussionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [replyContent, setReplyContent] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: topic, isLoading: topicLoading } = useDiscussionTopic(id || "");
  const { data: replies, isLoading: repliesLoading } = useDiscussionReplies(
    id || ""
  );

  const createReply = useCreateReply();
  const deleteTopic = useDeleteTopic();
  const togglePin = useTogglePinTopic();
  const toggleLock = useToggleLockTopic();

  const isAuthor = user?.id === topic?.author_id;
  const canModerate = isAuthor || isAdmin();
  const topLevelReplies = replies?.filter((r) => !r.parent_reply_id) || [];

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !id) return;

    try {
      await createReply.mutateAsync({
        topic_id: id,
        content: replyContent,
      });
      setReplyContent("");
      toast.success("Balasan berhasil dikirim");
    } catch {
      toast.error("Gagal mengirim balasan");
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteTopic.mutateAsync(id);
      toast.success("Topik berhasil dihapus");
      navigate("/referee/discussions");
    } catch {
      toast.error("Gagal menghapus topik");
    }
  };

  const handleTogglePin = async () => {
    if (!id || !topic) return;

    try {
      await togglePin.mutateAsync({ topicId: id, isPinned: !topic.is_pinned });
      toast.success(topic.is_pinned ? "Pin dihapus" : "Topik di-pin");
    } catch {
      toast.error("Gagal mengubah status pin");
    }
  };

  const handleToggleLock = async () => {
    if (!id || !topic) return;

    try {
      await toggleLock.mutateAsync({ topicId: id, isLocked: !topic.is_locked });
      toast.success(topic.is_locked ? "Topik dibuka" : "Topik dikunci");
    } catch {
      toast.error("Gagal mengubah status kunci");
    }
  };

  if (topicLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[100px]" />
        </div>
      </AppLayout>
    );
  }

  if (!topic) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">Topik tidak ditemukan</h2>
          <Button
            variant="link"
            onClick={() => navigate("/referee/discussions")}
          >
            Kembali ke daftar diskusi
          </Button>
        </div>
      </AppLayout>
    );
  }

  const authorName = topic.author?.full_name || "Anonim";
  const authorInitials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/referee/discussions")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>

        {/* Topic */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={topic.author?.profile_photo_url || undefined}
                />
                <AvatarFallback>{authorInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {topic.is_pinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      {topic.is_locked && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h1 className="text-xl font-bold">{topic.title}</h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <span>{authorName}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(topic.created_at), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </span>
                    </div>
                  </div>
                  {canModerate && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAdmin() && (
                          <>
                            <DropdownMenuItem onClick={handleTogglePin}>
                              <Pin className="h-4 w-4 mr-2" />
                              {topic.is_pinned ? "Hapus Pin" : "Pin Topik"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleToggleLock}>
                              {topic.is_locked ? (
                                <>
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Buka Topik
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Kunci Topik
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus Topik
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 my-3">
                  <Badge className={cn(getCategoryColor(topic.category))}>
                    {getCategoryLabel(topic.category)}
                  </Badge>
                  {topic.law_reference && (
                    <Badge variant="outline">Law {topic.law_reference}</Badge>
                  )}
                </div>

                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {topic.content}
                </p>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {topic.view_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {topic.reply_count} balasan
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {!topic.is_locked && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3">Tulis Balasan</h3>
              <Textarea
                placeholder="Bagikan pendapat atau jawaban Anda..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || createReply.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Balasan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {topic.is_locked && (
          <Card className="bg-muted/50">
            <CardContent className="py-4 text-center text-muted-foreground">
              <Lock className="h-5 w-5 mx-auto mb-2" />
              Topik ini telah dikunci. Tidak dapat menambah balasan baru.
            </CardContent>
          </Card>
        )}

        {/* Replies */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            Balasan ({topic.reply_count})
          </h3>
          {repliesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[100px]" />
              ))}
            </div>
          ) : topLevelReplies.length > 0 ? (
            <div className="space-y-4">
              {topLevelReplies.map((reply) => (
                <ReplyThread
                  key={reply.id}
                  reply={reply}
                  topicId={topic.id}
                  topicAuthorId={topic.author_id}
                  isTopicLocked={topic.is_locked}
                  allReplies={replies || []}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Belum ada balasan. Jadilah yang pertama merespons!
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Topik Diskusi?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Topik beserta semua
                balasannya akan dihapus permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default DiscussionDetail;
