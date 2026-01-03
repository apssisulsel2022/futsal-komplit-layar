-- Fix security definer views by recreating with SECURITY INVOKER
-- Drop and recreate views with proper security

DROP VIEW IF EXISTS public.active_profiles;
DROP VIEW IF EXISTS public.active_events;
DROP VIEW IF EXISTS public.active_honors;

-- Recreate views with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.active_profiles 
WITH (security_invoker = true)
AS SELECT * FROM public.profiles WHERE deleted_at IS NULL;

CREATE VIEW public.active_events 
WITH (security_invoker = true)
AS SELECT * FROM public.events WHERE deleted_at IS NULL;

CREATE VIEW public.active_honors 
WITH (security_invoker = true)
AS SELECT * FROM public.honors WHERE deleted_at IS NULL;