import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/reviews/StarRating";
import { useRefereeForReview, useSubmitReview } from "@/hooks/usePublicReviews";
import { useToast } from "@/hooks/use-toast";

export default function PublicReviewSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [comment, setComment] = useState("");

  const { data: referee, isLoading } = useRefereeForReview(id || "");
  const submitReview = useSubmitReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating diperlukan",
        description: "Silakan pilih rating bintang terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitReview.mutateAsync({
        refereeId: id!,
        rating,
        reviewerName: reviewerName.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      navigate("/review/success");
    } catch (error) {
      toast({
        title: "Gagal mengirim ulasan",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!referee) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto text-center py-12">
          <p className="text-muted-foreground">Wasit tidak ditemukan</p>
          <Button variant="link" onClick={() => navigate("/review")}>
            Kembali ke daftar
          </Button>
        </div>
      </div>
    );
  }

  const initials = referee.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background px-4 pt-4 pb-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate(`/review/${id}/detail`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          {/* Mini Referee Header */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={referee.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 className="font-semibold text-foreground">
                {referee.full_name}
              </h1>
              {referee.license_level && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {referee.license_level}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Star Rating */}
                <div className="text-center">
                  <Label className="text-base font-medium">
                    Berikan Penilaian Anda
                  </Label>
                  <div className="flex justify-center mt-4">
                    <StarRating
                      rating={rating}
                      size="lg"
                      interactive
                      onChange={setRating}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {rating === 0
                      ? "Ketuk bintang untuk menilai"
                      : `${rating} dari 5 bintang`}
                  </p>
                </div>

                {/* Reviewer Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Anda (opsional)</Label>
                  <Input
                    id="name"
                    placeholder="Masukkan nama Anda"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kosongkan jika ingin anonim
                  </p>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <Label htmlFor="comment">Komentar (opsional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Tulis ulasan Anda di sini..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {comment.length}/500 karakter
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={rating === 0 || submitReview.isPending}
                >
                  {submitReview.isPending ? "Mengirim..." : "Kirim Penilaian"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
