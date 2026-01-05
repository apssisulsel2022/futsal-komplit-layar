import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import {
  useCreateTopic,
  DISCUSSION_CATEGORIES,
} from "@/hooks/useDiscussions";
import { LOTG_CATEGORIES } from "@/hooks/useLearning";
import { toast } from "sonner";

const DiscussionNew = () => {
  const navigate = useNavigate();
  const createTopic = useCreateTopic();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [lawReference, setLawReference] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      const topic = await createTopic.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        category,
        law_reference: lawReference ? parseInt(lawReference) : undefined,
      });
      toast.success("Topik diskusi berhasil dibuat");
      navigate(`/referee/discussions/${topic.id}`);
    } catch {
      toast.error("Gagal membuat topik diskusi");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/referee/discussions")}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Buat Topik Diskusi Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Judul Topik <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Contoh: Interpretasi backpass dalam futsal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/200 karakter
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Kategori <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCUSSION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="law">Referensi Law (Opsional)</Label>
                  <Select value={lawReference} onValueChange={setLawReference}>
                    <SelectTrigger id="law">
                      <SelectValue placeholder="Pilih Law" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak ada</SelectItem>
                      {LOTG_CATEGORIES.map((cat) => (
                        <SelectItem
                          key={cat.law}
                          value={cat.law.toString()}
                        >
                          Law {cat.law}: {cat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  Isi Diskusi <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Jelaskan topik diskusi Anda secara detail. Sertakan contoh situasi jika ada..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Jelaskan dengan detail agar wasit lain dapat memahami dan
                  memberikan tanggapan yang relevan
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/referee/discussions")}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createTopic.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  {createTopic.isPending ? "Mengirim..." : "Buat Topik"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DiscussionNew;
