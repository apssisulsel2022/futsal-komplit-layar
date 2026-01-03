import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FFSSLogo } from "@/components/reviews/FFSSLogo";
import { RefereeCard } from "@/components/reviews/RefereeCard";
import { usePublicReferees, useAfkOrigins } from "@/hooks/usePublicReviews";

export default function PublicRefereeList() {
  const [search, setSearch] = useState("");
  const [afkFilter, setAfkFilter] = useState<string>("");

  const { data: referees, isLoading } = usePublicReferees(
    search || undefined,
    afkFilter || undefined
  );
  const { data: afkOrigins } = useAfkOrigins();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background pt-8 pb-6 px-4">
        <div className="max-w-md mx-auto">
          <FFSSLogo size="lg" />

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Penilaian Wasit Futsal
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Beri penilaian Anda secara jujur untuk membantu meningkatkan
              kualitas wasit futsal di Sulawesi Selatan
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-md mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama wasit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={afkFilter} onValueChange={setAfkFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Semua Kab/Kota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kab/Kota</SelectItem>
                {afkOrigins?.map((origin) => (
                  <SelectItem key={origin} value={origin}>
                    {origin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Referee List */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>
            ))
          ) : referees && referees.length > 0 ? (
            referees.map((referee) => (
              <RefereeCard
                key={referee.id}
                id={referee.id}
                name={referee.full_name}
                photoUrl={referee.profile_photo_url}
                licenseLevel={referee.license_level}
                location={referee.afk_origin}
                avgRating={referee.avg_rating}
                totalReviews={referee.total_reviews}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Tidak ada wasit ditemukan</p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-primary text-sm hover:underline"
                >
                  Hapus pencarian
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
