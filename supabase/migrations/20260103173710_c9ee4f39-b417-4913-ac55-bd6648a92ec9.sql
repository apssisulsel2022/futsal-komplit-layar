-- Allow referees to update their own assignment status (confirm/decline)
CREATE POLICY "Referees can update their own assignment status"
ON public.event_assignments
FOR UPDATE
USING (
  deleted_at IS NULL 
  AND auth.uid() = referee_id
  AND status IN ('pending', 'confirmed')
)
WITH CHECK (
  status IN ('confirmed', 'declined')
);