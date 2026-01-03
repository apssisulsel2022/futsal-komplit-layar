-- Create evaluation criteria table
CREATE TABLE public.evaluation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  weight integer DEFAULT 1,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create evaluations table (one per referee per event)
CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id),
  referee_id uuid NOT NULL REFERENCES public.profiles(id),
  evaluator_id uuid NOT NULL REFERENCES public.profiles(id),
  total_score numeric(5,2),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE(event_id, referee_id, evaluator_id)
);

-- Create evaluation scores table (individual scores per criteria)
CREATE TABLE public.evaluation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  criteria_id uuid NOT NULL REFERENCES public.evaluation_criteria(id),
  score integer NOT NULL CHECK (score >= 1 AND score <= 10),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, criteria_id)
);

-- Enable RLS
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_scores ENABLE ROW LEVEL SECURITY;

-- RLS for evaluation_criteria (everyone can view, admin can manage)
CREATE POLICY "Everyone can view active criteria"
  ON public.evaluation_criteria FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage criteria"
  ON public.evaluation_criteria FOR ALL
  USING (is_admin(auth.uid()));

-- RLS for evaluations
CREATE POLICY "Admins can view all evaluations"
  ON public.evaluations FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Evaluators can view their own evaluations"
  ON public.evaluations FOR SELECT
  USING (auth.uid() = evaluator_id);

CREATE POLICY "Referees can view their own evaluations"
  ON public.evaluations FOR SELECT
  USING (auth.uid() = referee_id AND status = 'submitted');

CREATE POLICY "Evaluators can create evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (auth.uid() = evaluator_id);

CREATE POLICY "Evaluators can update their draft evaluations"
  ON public.evaluations FOR UPDATE
  USING (auth.uid() = evaluator_id AND status = 'draft');

CREATE POLICY "Admin can update all evaluations"
  ON public.evaluations FOR UPDATE
  USING (is_admin(auth.uid()));

-- RLS for evaluation_scores
CREATE POLICY "View scores for accessible evaluations"
  ON public.evaluation_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e 
      WHERE e.id = evaluation_id 
      AND (is_admin(auth.uid()) OR e.evaluator_id = auth.uid() OR (e.referee_id = auth.uid() AND e.status = 'submitted'))
    )
  );

CREATE POLICY "Evaluators can manage scores for their evaluations"
  ON public.evaluation_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e 
      WHERE e.id = evaluation_id 
      AND e.evaluator_id = auth.uid() 
      AND e.status = 'draft'
    )
  );

CREATE POLICY "Admin can manage all scores"
  ON public.evaluation_scores FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default evaluation criteria
INSERT INTO public.evaluation_criteria (name, description, weight, sort_order) VALUES
  ('Pengetahuan Peraturan', 'Pemahaman dan penerapan peraturan futsal', 2, 1),
  ('Pengambilan Keputusan', 'Ketepatan dan kecepatan dalam mengambil keputusan', 2, 2),
  ('Penempatan Posisi', 'Posisi yang tepat untuk melihat permainan', 1, 3),
  ('Komunikasi', 'Komunikasi dengan pemain, official, dan wasit lain', 1, 4),
  ('Kontrol Permainan', 'Kemampuan mengendalikan jalannya pertandingan', 2, 5),
  ('Kebugaran Fisik', 'Stamina dan kelincahan selama pertandingan', 1, 6),
  ('Sikap Profesional', 'Penampilan, ketepatan waktu, dan profesionalisme', 1, 7);

-- Create trigger for updated_at
CREATE TRIGGER update_evaluation_criteria_updated_at
  BEFORE UPDATE ON public.evaluation_criteria
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();