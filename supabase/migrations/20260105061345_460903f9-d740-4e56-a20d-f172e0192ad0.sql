-- =============================================
-- MODUL PEMBELAJARAN LOTG FUTSAL & RUANG DISKUSI
-- =============================================

-- 1. Tabel Learning Materials (Materi Pembelajaran)
CREATE TABLE public.learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  law_number INTEGER,
  content TEXT NOT NULL,
  video_url TEXT,
  pdf_url TEXT,
  difficulty_level TEXT DEFAULT 'basic',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Learning Progress (Progres Belajar)
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.learning_materials(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, material_id)
);

-- 3. Tabel Discussion Topics (Topik Diskusi)
CREATE TABLE public.discussion_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  law_reference INTEGER,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Discussion Replies (Balasan Diskusi)
CREATE TABLE public.discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.discussion_topics(id) ON DELETE CASCADE NOT NULL,
  parent_reply_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Learning Materials Policies
CREATE POLICY "Everyone can view published materials"
ON public.learning_materials FOR SELECT
USING (is_published = true);

CREATE POLICY "Admin can manage all materials"
ON public.learning_materials FOR ALL
USING (is_admin(auth.uid()));

-- Learning Progress Policies
CREATE POLICY "Users can view their own progress"
ON public.learning_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.learning_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.learning_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Discussion Topics Policies
CREATE POLICY "Authenticated users can view topics"
ON public.discussion_topics FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create topics"
ON public.discussion_topics FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own topics"
ON public.discussion_topics FOR UPDATE
USING (auth.uid() = author_id OR is_admin(auth.uid()));

CREATE POLICY "Authors can delete their own topics"
ON public.discussion_topics FOR DELETE
USING (auth.uid() = author_id OR is_admin(auth.uid()));

-- Discussion Replies Policies
CREATE POLICY "Authenticated users can view replies"
ON public.discussion_replies FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create replies"
ON public.discussion_replies FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own replies"
ON public.discussion_replies FOR UPDATE
USING (auth.uid() = author_id OR is_admin(auth.uid()));

CREATE POLICY "Authors can delete their own replies"
ON public.discussion_replies FOR DELETE
USING (auth.uid() = author_id OR is_admin(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps
CREATE TRIGGER set_learning_materials_updated_at
BEFORE UPDATE ON public.learning_materials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_discussion_topics_updated_at
BEFORE UPDATE ON public.discussion_topics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_discussion_replies_updated_at
BEFORE UPDATE ON public.discussion_replies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to update reply count
CREATE OR REPLACE FUNCTION public.update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussion_topics 
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussion_topics 
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.topic_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_reply_count
AFTER INSERT OR DELETE ON public.discussion_replies
FOR EACH ROW EXECUTE FUNCTION public.update_topic_reply_count();

-- =============================================
-- SEED DATA - MATERI LOTG DASAR
-- =============================================

INSERT INTO public.learning_materials (title, description, category, law_number, content, difficulty_level, sort_order) VALUES
('Lapangan Permainan Futsal', 'Memahami dimensi dan marking lapangan futsal sesuai standar FIFA', 'law_1_pitch', 1, 
'# Law 1: Lapangan Permainan

## Dimensi Lapangan
Lapangan futsal harus berbentuk persegi panjang dengan dimensi:
- **Panjang**: 25-42 meter (internasional: 38-42 meter)
- **Lebar**: 16-25 meter (internasional: 20-25 meter)

## Garis Lapangan
- Semua garis harus memiliki lebar **8 cm**
- Garis yang lebih panjang disebut **garis samping (touchline)**
- Garis yang lebih pendek disebut **garis gawang (goal line)**

## Area Penalti
- Berbentuk seperempat lingkaran dengan radius **6 meter** dari tiang gawang
- Titik penalti berada **6 meter** dari titik tengah garis gawang
- Titik penalti kedua berada **10 meter** dari titik tengah garis gawang

## Gawang
- Lebar: **3 meter** (diukur dari dalam tiang ke tiang)
- Tinggi: **2 meter** (dari tanah ke mistar)
- Tiang dan mistar harus berwarna sama dan kontras dengan lapangan

## Zona Pergantian
- Panjang **5 meter** di depan bangku cadangan
- Terletak di samping lapangan, berlawanan dengan meja pencatat waktu
', 'basic', 1),

('Wasit dalam Pertandingan Futsal', 'Peran, wewenang, dan tanggung jawab wasit dalam futsal', 'law_5_referees', 5,
'# Law 5: Wasit

## Wewenang Wasit
Setiap pertandingan dikontrol oleh **dua wasit** dengan wewenang penuh untuk menegakkan Laws of the Game.

### Wasit Utama (First Referee)
- Berdiri di sisi kiri lapangan
- Bertanggung jawab atas keputusan akhir
- Mencatat semua pelanggaran terakumulasi

### Wasit Kedua (Second Referee)
- Berdiri di sisi kanan lapangan
- Membantu wasit utama dalam pengambilan keputusan
- Memiliki wewenang yang sama dengan wasit utama

## Tugas dan Tanggung Jawab

### Sebelum Pertandingan
- Memeriksa bola dan perlengkapan
- Memastikan lapangan sesuai standar
- Memeriksa perlengkapan pemain

### Selama Pertandingan
- Menegakkan Laws of the Game
- Mencatat waktu dan skor
- Menghentikan permainan jika terjadi pelanggaran
- Memberikan peringatan dan pengusiran

### Setelah Pertandingan
- Membuat laporan pertandingan
- Melaporkan insiden serius

## Sinyal Wasit
- Tendangan bebas langsung: tangan horizontal menunjuk arah
- Tendangan bebas tidak langsung: tangan ke atas sampai bola dimainkan
- Penalti: menunjuk titik penalti
- Accumulated foul ke-6+: tangan menunjuk titik penalti kedua
', 'basic', 5),

('Pelanggaran dalam Futsal', 'Jenis-jenis pelanggaran dan sanksinya', 'law_12_fouls', 12,
'# Law 12: Pelanggaran

## Tendangan Bebas Langsung
Diberikan jika pemain melakukan pelanggaran berikut dengan cara yang dianggap wasit ceroboh, sembrono, atau dengan kekuatan berlebihan:

1. **Menendang** atau mencoba menendang lawan
2. **Menjegal** atau mencoba menjegal lawan
3. **Melompat** ke arah lawan
4. **Menabrak** lawan
5. **Memukul** atau mencoba memukul lawan
6. **Mendorong** lawan
7. **Menahan** lawan
8. **Meludahi** lawan
9. **Melakukan tackle** dan mengenai lawan sebelum bola
10. **Menyentuh bola dengan tangan** (kecuali penjaga gawang di area penalti)

## Pelanggaran Terakumulasi
- 5 pelanggaran pertama: tendangan bebas dengan dinding
- **Pelanggaran ke-6 dan seterusnya**: tendangan bebas **TANPA DINDING** dari titik penalti kedua (10 meter)

## Tendangan Bebas Tidak Langsung
Diberikan jika:
- Penjaga gawang menyentuh bola dengan tangan setelah menerimanya kembali dari rekan setim
- Penjaga gawang menguasai bola lebih dari **4 detik**
- Offside (jika berlaku di kompetisi tertentu)
- Menghalangi lawan tanpa memainkan bola

## Kartu Kuning (Peringatan)
- Perilaku tidak sportif
- Menunda restart permainan
- Berulang kali melanggar aturan
- Masuk/keluar lapangan tanpa izin wasit

## Kartu Merah (Pengusiran)
- Pelanggaran serius
- Perilaku kasar
- Meludahi orang lain
- Mencegah gol dengan handball (selain penjaga gawang)
- Menerima kartu kuning kedua
', 'basic', 12),

('Tendangan Penalti Futsal', 'Prosedur dan aturan tendangan penalti', 'law_14_penalty', 14,
'# Law 14: Tendangan Penalti

## Kapan Diberikan
Tendangan penalti diberikan ketika pemain melakukan pelanggaran yang layak mendapat tendangan bebas langsung **di dalam area penalti sendiri**.

## Prosedur

### Posisi Bola
- Bola ditempatkan di **titik penalti** (6 meter dari garis gawang)

### Penendang
- Harus diidentifikasi dengan jelas
- Hanya boleh menendang bola **ke depan**

### Penjaga Gawang
- Harus berada di **garis gawang**
- Menghadap penendang
- Boleh bergerak ke samping tapi tidak ke depan sampai bola ditendang

### Pemain Lain
- Berada di belakang bola
- Di luar area penalti
- Minimal 5 meter dari bola

## Aturan Penting
- Jika gol: restart dengan kick-off
- Jika tidak gol dan bola keluar: goal clearance atau corner kick
- Jika bola memantul ke lapangan: permainan dilanjutkan
- **Penendang tidak boleh menyentuh bola dua kali** sebelum pemain lain menyentuhnya

## Pelanggaran Tendangan Penalti Kedua (10 meter)
Diberikan untuk pelanggaran terakumulasi ke-6 dan seterusnya:
- Tidak ada dinding
- Penendang harus menembak langsung ke gawang
- Jika bola memantul dari penjaga gawang, penendang **tidak boleh** menyentuh bola lagi
', 'intermediate', 14);

-- Enable realtime for discussions
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_replies;