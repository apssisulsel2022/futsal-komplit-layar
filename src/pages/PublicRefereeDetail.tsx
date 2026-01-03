import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/reviews/StarRating";
import { useRefereeForReview, useRefereeReviews } from "@/hooks/usePublicReviews";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function PublicRefereeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: referee, isLoading: refereeLoading } = useRefereeForReview(id || "");
  const { data: reviews, isLoading: reviewsLoading } = useRefereeReviews(id || "");

  if (refereeLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
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
            onClick={() => navigate("/review")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          {/* Referee Profile */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={referee.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <h1 className="mt-4 text-xl font-bold text-foreground">
              {referee.full_name}
            </h1>

            <div className="flex items-center gap-2 mt-2">
              {referee.license_level && (
                <Badge variant="secondary">{referee.license_level}</Badge>
              )}
              {referee.afk_origin && (
                <Badge variant="outline">{referee.afk_origin}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="px-4 -mt-2">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
                <span className="text-4xl font-bold text-foreground">
                  {referee.avg_rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                dari {referee.total_reviews} ulasan
              </p>

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={() => navigate(`/review/${id}`)}
              >
                Beri Penilaian
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reviews List */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4">Ulasan</h2>

          {reviewsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {review.reviewer_name || "Pengguna Anonim"}
                        </p>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada ulasan</p>
              <p className="text-sm text-muted-foreground mt-1">
                Jadilah yang pertama memberikan ulasan!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
