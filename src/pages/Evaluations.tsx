import { useState } from "react";
import { Plus, Search, Filter, Star, ClipboardCheck, TrendingUp, TrendingDown, Calendar, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useEvaluations, useEvaluationCriteria } from "@/hooks/useEvaluations";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Evaluations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const { data: pendingEvaluations, isLoading: loadingPending } = useEvaluations("draft");
  const { data: completedEvaluations, isLoading: loadingCompleted } = useEvaluations("submitted");
  const { data: criteria } = useEvaluationCriteria();

  const filteredPending = pendingEvaluations?.filter((e) =>
    e.referee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.event?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCompleted = completedEvaluations?.filter((e) =>
    e.referee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.event?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const avgScore = completedEvaluations?.length
    ? completedEvaluations.reduce((acc, e) => acc + (e.total_score || 0), 0) / completedEvaluations.length
    : 0;

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-primary";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <AppLayout title="Evaluasi">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingEvaluations?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Perlu Evaluasi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Rata-rata Skor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Criteria Overview */}
        {criteria && criteria.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kriteria Penilaian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {criteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">Bobot: {c.weight}x</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari evaluasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pending" className="relative">
              Menunggu
              {(pendingEvaluations?.length || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                  {pendingEvaluations?.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Selesai</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {loadingPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredPending.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="Tidak ada evaluasi menunggu"
                description="Semua evaluasi sudah selesai"
              />
            ) : (
              filteredPending.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={item.referee?.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(item.referee?.full_name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{item.referee?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{item.event?.name}</p>
                          </div>
                          <StatusBadge status="warning">Draft</StatusBadge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {item.event?.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(item.event.date), "d MMM yyyy", { locale: localeId })}
                            </span>
                          )}
                          {item.event?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      onClick={() => navigate(`/evaluations/${item.id}`)}
                    >
                      Lanjutkan Evaluasi
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {loadingCompleted ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredCompleted.length === 0 ? (
              <EmptyState
                icon={Star}
                title="Belum ada evaluasi selesai"
                description="Evaluasi yang sudah disubmit akan muncul di sini"
              />
            ) : (
              filteredCompleted.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/evaluations/${item.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={item.referee?.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(item.referee?.full_name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{item.referee?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{item.event?.name}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className={`text-lg font-bold ${getScoreColor(item.total_score || 0)}`}>
                              {item.total_score?.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {item.event?.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(item.event.date), "d MMM yyyy", { locale: localeId })}
                            </span>
                          )}
                          {item.submitted_at && (
                            <span>
                              Disubmit: {format(new Date(item.submitted_at), "d MMM yyyy", { locale: localeId })}
                            </span>
                          )}
                        </div>
                        <Progress value={item.total_score || 0} className="h-1.5 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-24 right-4 md:bottom-8 rounded-full shadow-lg h-14 w-14 p-0"
          onClick={() => navigate("/evaluations/new")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
