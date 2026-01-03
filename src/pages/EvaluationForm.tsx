import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Send, Star, User, Calendar, MapPin } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useEvaluation,
  useEvaluationCriteria,
  useEvaluationScores,
  useSaveEvaluationScores,
  useSubmitEvaluation,
} from "@/hooks/useEvaluations";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ScoreInput {
  criteria_id: string;
  score: number;
  notes?: string;
}

export default function EvaluationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: evaluation, isLoading: loadingEvaluation } = useEvaluation(id || "");
  const { data: criteria, isLoading: loadingCriteria } = useEvaluationCriteria();
  const { data: existingScores } = useEvaluationScores(id || "");
  const saveScores = useSaveEvaluationScores();
  const submitEvaluation = useSubmitEvaluation();

  const [scores, setScores] = useState<ScoreInput[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize scores from criteria or existing scores
  useEffect(() => {
    if (criteria && criteria.length > 0) {
      const initialScores = criteria.map((c) => {
        const existing = existingScores?.find((s) => s.criteria_id === c.id);
        return {
          criteria_id: c.id,
          score: existing?.score || 5,
          notes: existing?.notes || "",
        };
      });
      setScores(initialScores);
    }
  }, [criteria, existingScores]);

  useEffect(() => {
    if (evaluation?.notes) {
      setNotes(evaluation.notes);
    }
  }, [evaluation]);

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) =>
      prev.map((s) => (s.criteria_id === criteriaId ? { ...s, score: value } : s))
    );
  };

  const calculateTotalScore = () => {
    if (!criteria || scores.length === 0) return 0;
    let totalWeight = 0;
    let weightedSum = 0;

    scores.forEach((s) => {
      const c = criteria.find((c) => c.id === s.criteria_id);
      if (c) {
        totalWeight += c.weight;
        weightedSum += s.score * c.weight;
      }
    });

    return totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0; // Scale to 100
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await saveScores.mutateAsync({ evaluationId: id, scores });
      toast.success("Evaluasi tersimpan");
    } catch (error) {
      toast.error("Gagal menyimpan evaluasi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      // Save scores first
      await saveScores.mutateAsync({ evaluationId: id, scores });

      // Then submit
      const totalScore = calculateTotalScore();
      await submitEvaluation.mutateAsync({
        evaluationId: id,
        totalScore,
        notes,
      });

      toast.success("Evaluasi berhasil disubmit");
      navigate("/evaluations");
    } catch (error) {
      toast.error("Gagal submit evaluasi");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";

  const totalScore = calculateTotalScore();
  const isReadOnly = evaluation?.status === "submitted";

  if (loadingEvaluation || loadingCriteria) {
    return (
      <AppLayout title="Evaluasi">
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!evaluation) {
    return (
      <AppLayout title="Evaluasi">
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Evaluasi tidak ditemukan</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/evaluations")}>
            Kembali
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isReadOnly ? "Detail Evaluasi" : "Form Evaluasi"}
      showBackButton
      onBack={() => navigate("/evaluations")}
    >
      <div className="p-4 space-y-4 pb-24">
        {/* Referee & Event Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={evaluation.referee?.profile_photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(evaluation.referee?.full_name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{evaluation.referee?.full_name}</p>
                <p className="text-sm text-muted-foreground">{evaluation.event?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{totalScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Skor Total</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {evaluation.event?.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(evaluation.event.date), "d MMMM yyyy", { locale: localeId })}
                </span>
              )}
              {evaluation.event?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {evaluation.event.location}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scoring Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />
              Penilaian Kriteria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {criteria?.map((c) => {
              const scoreData = scores.find((s) => s.criteria_id === c.id);
              const score = scoreData?.score || 5;

              return (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">{c.name}</Label>
                      {c.description && (
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-primary">{score}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <Slider
                    value={[score]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([value]) => handleScoreChange(c.id, value)}
                    disabled={isReadOnly}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Kurang</span>
                    <span>Cukup</span>
                    <span>Baik</span>
                    <span>Sangat Baik</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Catatan Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Tambahkan catatan atau komentar tentang performa wasit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              disabled={isReadOnly}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        {!isReadOnly && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3 md:static md:border-0 md:p-0">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Draft
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isSaving}>
              <Send className="h-4 w-4 mr-2" />
              Submit Evaluasi
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
