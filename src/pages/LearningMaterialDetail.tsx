import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Video,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  useLearningMaterial,
  useLearningProgress,
  useMarkComplete,
  useMarkIncomplete,
  getCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
} from "@/hooks/useLearning";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LearningMaterialDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: material, isLoading } = useLearningMaterial(id || "");
  const { data: progress } = useLearningProgress();
  const markComplete = useMarkComplete();
  const markIncomplete = useMarkIncomplete();

  const isCompleted = progress?.some(
    (p) => p.material_id === id && p.is_completed
  );

  const handleToggleComplete = async () => {
    if (!id) return;

    try {
      if (isCompleted) {
        await markIncomplete.mutateAsync(id);
        toast.success("Materi ditandai belum selesai");
      } else {
        await markComplete.mutateAsync(id);
        toast.success("Materi ditandai selesai! 🎉");
      }
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  // Simple markdown renderer
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === "ol" ? "ol" : "ul";
        elements.push(
          <ListTag
            key={elements.length}
            className={cn(
              "mb-4 ml-6",
              listType === "ol" ? "list-decimal" : "list-disc"
            )}
          >
            {listItems.map((item, i) => (
              <li key={i} className="mb-1">
                {renderInline(item)}
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
        listType = null;
      }
    };

    const renderInline = (text: string) => {
      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Inline code
      text = text.replace(/`(.*?)`/g, "<code>$1</code>");
      return <span dangerouslySetInnerHTML={{ __html: text }} />;
    };

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith("# ")) {
        flushList();
        elements.push(
          <h1 key={index} className="text-2xl font-bold mb-4 mt-6">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={index} className="text-xl font-semibold mb-3 mt-5">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={index} className="text-lg font-medium mb-2 mt-4">
            {line.slice(4)}
          </h3>
        );
      }
      // Numbered list
      else if (/^\d+\.\s/.test(line)) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        listItems.push(line.replace(/^\d+\.\s/, ""));
      }
      // Bullet list
      else if (line.startsWith("- ")) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        listItems.push(line.slice(2));
      }
      // Empty line
      else if (line.trim() === "") {
        flushList();
      }
      // Regular paragraph
      else {
        flushList();
        elements.push(
          <p key={index} className="mb-3 text-foreground/90 leading-relaxed">
            {renderInline(line)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  if (!material) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-lg font-medium">Materi tidak ditemukan</h2>
          <Button variant="link" onClick={() => navigate("/referee/learning")}>
            Kembali ke daftar materi
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/referee/learning")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{getCategoryLabel(material.category)}</Badge>
            <Badge className={getDifficultyColor(material.difficulty_level)}>
              {getDifficultyLabel(material.difficulty_level)}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{material.title}</h1>
          {material.description && (
            <p className="text-muted-foreground">{material.description}</p>
          )}
        </div>

        {/* Media links */}
        {(material.video_url || material.pdf_url) && (
          <div className="flex flex-wrap gap-3">
            {material.video_url && (
              <Button variant="outline" asChild>
                <a
                  href={material.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Tonton Video
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            {material.pdf_url && (
              <Button variant="outline" asChild>
                <a
                  href={material.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <Card>
          <CardContent className="pt-6 prose prose-sm max-w-none">
            {renderContent(material.content)}
          </CardContent>
        </Card>

        {/* Complete button */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {isCompleted ? "Materi selesai!" : "Tandai sebagai selesai"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isCompleted
                      ? "Klik untuk membatalkan"
                      : "Setelah Anda memahami materi ini"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggleComplete}
                variant={isCompleted ? "outline" : "default"}
                disabled={markComplete.isPending || markIncomplete.isPending}
              >
                {isCompleted ? "Batalkan" : "Selesai"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default LearningMaterialDetail;
