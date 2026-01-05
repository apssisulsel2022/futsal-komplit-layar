import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pin,
  Lock,
  MessageSquare,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  DiscussionTopic,
  getCategoryLabel,
  getCategoryColor,
} from "@/hooks/useDiscussions";
import { cn } from "@/lib/utils";

interface DiscussionCardProps {
  topic: DiscussionTopic;
}

export const DiscussionCard = ({ topic }: DiscussionCardProps) => {
  const authorName = topic.author?.full_name || "Anonim";
  const authorInitials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link to={`/referee/discussions/${topic.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={topic.author?.profile_photo_url || undefined} />
              <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {topic.is_pinned && (
                  <Pin className="h-4 w-4 text-primary shrink-0" />
                )}
                {topic.is_locked && (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <CardTitle className="text-base line-clamp-1">
                  {topic.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {topic.content}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              <Badge className={cn("text-xs", getCategoryColor(topic.category))}>
                {getCategoryLabel(topic.category)}
              </Badge>
              {topic.law_reference && (
                <Badge variant="outline" className="text-xs">
                  Law {topic.law_reference}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {topic.view_count}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {topic.reply_count}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
