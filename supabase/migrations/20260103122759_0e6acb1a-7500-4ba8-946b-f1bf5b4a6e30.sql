-- Update status to use Indonesian terms with check constraint
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_status_check;

-- Update existing statuses to new values
UPDATE public.events SET status = 
  CASE status
    WHEN 'upcoming' THEN 'DIAJUKAN'
    WHEN 'approved' THEN 'DISETUJUI'
    WHEN 'rejected' THEN 'DITOLAK'
    WHEN 'completed' THEN 'SELESAI'
    ELSE 'DIAJUKAN'
  END;

-- Add check constraint
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('DIAJUKAN', 'DISETUJUI', 'DITOLAK', 'SELESAI'));

-- Change default
ALTER TABLE public.events 
ALTER COLUMN status SET DEFAULT 'DIAJUKAN';

-- Add kabupaten_kota_id to events for regional filtering
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS kabupaten_kota_id uuid REFERENCES public.kabupaten_kota(id) ON DELETE SET NULL;

-- Create event_approvals table for approval history
CREATE TABLE IF NOT EXISTS public.event_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('SUBMIT', 'APPROVE', 'REJECT', 'COMPLETE', 'REVISION_REQUEST')),
  from_status text,
  to_status text NOT NULL,
  notes text,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on event_approvals
ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;

-- RLS for event_approvals
CREATE POLICY "Everyone can view event approvals"
ON public.event_approvals FOR SELECT
USING (true);

CREATE POLICY "Admin can insert approvals"
ON public.event_approvals FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'panitia'));

-- Update events RLS to allow panitia to create
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
CREATE POLICY "Admin and panitia can create events"
ON public.events FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR has_role(auth.uid(), 'panitia')
);

-- Update events RLS to allow updates
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
USING (
  is_admin(auth.uid()) OR 
  (has_role(auth.uid(), 'panitia') AND created_by = auth.uid())
);

-- Create function to check if event is approved
CREATE OR REPLACE FUNCTION public.is_event_approved(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND status = 'DISETUJUI'
  )
$$;

-- Update event_assignments RLS
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.event_assignments;
CREATE POLICY "Admins can manage assignments on approved events"
ON public.event_assignments FOR ALL
USING (
  is_admin(auth.uid()) AND 
  is_event_approved(event_id)
);