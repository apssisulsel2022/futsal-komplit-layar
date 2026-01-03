import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./StarRating";
import { MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RefereeCardProps {
  id: string;
  name: string;
  photoUrl?: string | null;
  licenseLevel?: string | null;
  location?: string | null;
  avgRating: number;
  totalReviews: number;
}

export function RefereeCard({
  id,
  name,
  photoUrl,
  licenseLevel,
  location,
  avgRating,
  totalReviews,
}: RefereeCardProps) {
  const navigate = useNavigate();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.99]"
      onClick={() => navigate(`/review/${id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-primary/20">
            <AvatarImage src={photoUrl || undefined} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            
            <div className="flex items-center gap-2 mt-1">
              {licenseLevel && (
                <Badge variant="secondary" className="text-xs">
                  {licenseLevel}
                </Badge>
              )}
              {location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={avgRating} size="sm" />
              <span className="text-sm text-muted-foreground">
                ({totalReviews} ulasan)
              </span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
