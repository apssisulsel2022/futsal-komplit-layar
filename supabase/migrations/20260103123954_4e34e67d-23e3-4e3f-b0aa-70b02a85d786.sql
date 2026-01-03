
-- Update honors table status constraint
ALTER TABLE public.honors
DROP CONSTRAINT IF EXISTS honors_status_check;

ALTER TABLE public.honors
ADD CONSTRAINT honors_status_check 
CHECK (status IN ('draft', 'submitted', 'verified', 'rejected'));

-- Create function to validate honor submission
CREATE OR REPLACE FUNCTION public.validate_honor_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For new honors, check if referee is assigned to the event
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.event_assignments
        WHERE event_id = NEW.event_id
          AND referee_id = NEW.referee_id
          AND status != 'cancelled'
      ) THEN
        RAISE EXCEPTION 'Wasit tidak ditugaskan ke event ini';
      END IF;
    END IF;
  END IF;
  
  -- Prevent editing amount after submission (admin cannot change wasit input)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'draft' AND NEW.amount != OLD.amount THEN
      RAISE EXCEPTION 'Tidak dapat mengubah jumlah honor setelah disubmit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for honor validation
DROP TRIGGER IF EXISTS validate_honor_trigger ON public.honors;
CREATE TRIGGER validate_honor_trigger
  BEFORE INSERT OR UPDATE ON public.honors
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_honor_submission();

-- Create function to auto-set verified_at and verified_by
CREATE OR REPLACE FUNCTION public.handle_honor_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When status changes to verified or rejected, set verification info
  IF NEW.status IN ('verified', 'rejected') AND OLD.status != NEW.status THEN
    NEW.verified_at = now();
    -- verified_by should be set by the caller
  END IF;
  
  -- Clear verification info if going back to draft
  IF NEW.status = 'draft' AND OLD.status != 'draft' THEN
    NEW.verified_at = NULL;
    NEW.verified_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for verification handling
DROP TRIGGER IF EXISTS handle_honor_verification_trigger ON public.honors;
CREATE TRIGGER handle_honor_verification_trigger
  BEFORE UPDATE ON public.honors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_honor_verification();

-- Create view for honor statistics
CREATE OR REPLACE VIEW public.honor_statistics AS
SELECT 
  referee_id,
  COUNT(*) FILTER (WHERE status = 'verified') as total_verified,
  COUNT(*) FILTER (WHERE status = 'submitted') as total_pending,
  COUNT(*) FILTER (WHERE status = 'rejected') as total_rejected,
  COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0) as total_earned,
  COALESCE(SUM(amount) FILTER (WHERE status = 'submitted'), 0) as pending_amount
FROM public.honors
GROUP BY referee_id;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_honors_referee_status ON public.honors(referee_id, status);
CREATE INDEX IF NOT EXISTS idx_honors_event ON public.honors(event_id);
