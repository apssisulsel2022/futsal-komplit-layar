-- Create referee_reviews table for public reviews
CREATE TABLE public.referee_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referee_reviews ENABLE ROW LEVEL SECURITY;

-- Public INSERT policy - anyone can submit reviews (no auth required)
CREATE POLICY "Anyone can submit reviews"
ON public.referee_reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public SELECT policy - anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.referee_reviews
FOR SELECT
TO anon, authenticated
USING (true);

-- Create view for aggregated review stats
CREATE VIEW public.referee_review_stats AS
SELECT 
  referee_id,
  COUNT(*)::integer AS total_reviews,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating
FROM public.referee_reviews
GROUP BY referee_id;

-- Add public SELECT policy on profiles for referees (so public can see referee list)
CREATE POLICY "Public can view referee profiles"
ON public.profiles
FOR SELECT
TO anon
USING (true);