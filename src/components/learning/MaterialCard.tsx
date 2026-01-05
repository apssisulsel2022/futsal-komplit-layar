import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, BookOpen, Video, FileText } from "lucide-react";
import {
  LearningMaterial,
  getCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
} from "@/hooks/useLearning";
import { cn } from "@/lib/utils";

interface MaterialCardProps {
  material: LearningMaterial;
  isCompleted?: boolean;
}

export const MaterialCard = ({ material, isCompleted }: MaterialCardProps) => {
  return (
    <Link to={`/referee/learning/${material.id}`}>
      <Card
        className={cn(
          "h-full transition-all hover:shadow-md hover:border-primary/50",
          isCompleted && "border-green-500/50 bg-green-500/5"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2">
              {material.title}
            </CardTitle>
            {isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-xs">
              {getCategoryLabel(material.category)}
            </Badge>
            <Badge className={cn("text-xs", getDifficultyColor(material.difficulty_level))}>
              {getDifficultyLabel(material.difficulty_level)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {material.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {material.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Materi
            </span>
            {material.video_url && (
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                Video
              </span>
            )}
            {material.pdf_url && (
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                PDF
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
