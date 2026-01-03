-- Drop and recreate view with SECURITY INVOKER (default, but explicit for clarity)
DROP VIEW IF EXISTS public.referee_review_stats;

CREATE VIEW public.referee_review_stats 
WITH (security_invoker = true) AS
SELECT 
  referee_id,
  COUNT(*)::integer AS total_reviews,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating
FROM public.referee_reviews
GROUP BY referee_id;