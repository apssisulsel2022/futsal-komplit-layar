
-- Drop the security definer view and recreate as a regular function
DROP VIEW IF EXISTS public.honor_statistics;

-- Create a security definer function instead (safer than SECURITY DEFINER view)
CREATE OR REPLACE FUNCTION public.get_honor_statistics(_referee_id uuid DEFAULT NULL)
RETURNS TABLE (
  referee_id uuid,
  total_verified bigint,
  total_pending bigint,
  total_rejected bigint,
  total_earned bigint,
  pending_amount bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    h.referee_id,
    COUNT(*) FILTER (WHERE h.status = 'verified') as total_verified,
    COUNT(*) FILTER (WHERE h.status = 'submitted') as total_pending,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as total_rejected,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_earned,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0) as pending_amount
  FROM public.honors h
  WHERE (_referee_id IS NULL OR h.referee_id = _referee_id)
  GROUP BY h.referee_id
$$;
