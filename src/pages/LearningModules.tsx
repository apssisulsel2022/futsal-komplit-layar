import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, GraduationCap } from "lucide-react";
import { MaterialCard } from "@/components/learning/MaterialCard";
import {
  useLearningMaterials,
  useLearningProgress,
  LOTG_CATEGORIES,
} from "@/hooks/useLearning";

const LearningModules = () => {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [selectedLaw, setSelectedLaw] = useState<string>("all");

  const { data: materials, isLoading } = useLearningMaterials({
    search: search || undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    category: selectedLaw !== "all" ? selectedLaw : undefined,
  });

  const { data: progress } = useLearningProgress();

  const completedIds = useMemo(() => {
    return new Set(
      progress?.filter((p) => p.is_completed).map((p) => p.material_id) || []
    );
  }, [progress]);

  const totalMaterials = materials?.length || 0;
  const completedCount = materials?.filter((m) => completedIds.has(m.id)).length || 0;
  const progressPercent = totalMaterials > 0 ? (completedCount / totalMaterials) * 100 : 0;

  // Group materials by law number
  const groupedMaterials = useMemo(() => {
    if (!materials) return {};
    return materials.reduce((acc, material) => {
      const law = material.law_number || 0;
      if (!acc[law]) acc[law] = [];
      acc[law].push(material);
      return acc;
    }, {} as Record<number, typeof materials>);
  }, [materials]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              Modul Pembelajaran LOTG
            </h1>
            <p className="text-muted-foreground mt-1">
              Pelajari Laws of the Game Futsal FIFA
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progres Belajar</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {totalMaterials} materi selesai
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari materi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedLaw} onValueChange={setSelectedLaw}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Pilih Law" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Law</SelectItem>
              {LOTG_CATEGORIES.map((cat) => (
                <SelectItem key={cat.category} value={cat.category}>
                  Law {cat.law}: {cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Tingkat Kesulitan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="basic">Dasar</SelectItem>
              <SelectItem value="intermediate">Menengah</SelectItem>
              <SelectItem value="advanced">Lanjutan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        ) : materials && materials.length > 0 ? (
          selectedLaw !== "all" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  isCompleted={completedIds.has(material.id)}
                />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="grid" className="space-y-4">
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="by-law">Per Law</TabsTrigger>
              </TabsList>
              <TabsContent value="grid">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {materials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      isCompleted={completedIds.has(material.id)}
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="by-law" className="space-y-6">
                {Object.entries(groupedMaterials)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([lawNum, lawMaterials]) => {
                    const category = LOTG_CATEGORIES.find(
                      (c) => c.law === Number(lawNum)
                    );
                    return (
                      <div key={lawNum}>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          {category
                            ? `Law ${category.law}: ${category.title}`
                            : `Law ${lawNum}`}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {lawMaterials.map((material) => (
                            <MaterialCard
                              key={material.id}
                              material={material}
                              isCompleted={completedIds.has(material.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </TabsContent>
            </Tabs>
          )
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Belum ada materi</h3>
            <p className="text-muted-foreground mt-1">
              Materi pembelajaran akan segera ditambahkan
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default LearningModules;
