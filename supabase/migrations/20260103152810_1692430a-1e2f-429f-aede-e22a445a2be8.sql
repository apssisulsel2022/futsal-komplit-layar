-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert audit logs (via triggers with security definer)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Trigger function for event approvals
CREATE OR REPLACE FUNCTION public.log_event_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
  VALUES (
    'EVENT_APPROVAL',
    'events',
    NEW.event_id,
    NEW.approved_by,
    jsonb_build_object('from_status', NEW.from_status),
    jsonb_build_object('to_status', NEW.to_status, 'action', NEW.action),
    jsonb_build_object('notes', NEW.notes, 'approval_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Trigger for event_approvals
CREATE TRIGGER audit_event_approval
AFTER INSERT ON public.event_approvals
FOR EACH ROW
EXECUTE FUNCTION public.log_event_approval();

-- Trigger function for referee assignments
CREATE OR REPLACE FUNCTION public.log_referee_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, new_data, metadata)
    VALUES (
      'REFEREE_ASSIGNED',
      'event_assignments',
      NEW.id,
      auth.uid(),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'role', NEW.role, 'status', NEW.status),
      jsonb_build_object('event_id', NEW.event_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
      VALUES (
        'REFEREE_ASSIGNMENT_UPDATED',
        'event_assignments',
        NEW.id,
        auth.uid(),
        jsonb_build_object('status', OLD.status, 'role', OLD.role),
        jsonb_build_object('status', NEW.status, 'role', NEW.role),
        jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, metadata)
    VALUES (
      'REFEREE_UNASSIGNED',
      'event_assignments',
      OLD.id,
      auth.uid(),
      jsonb_build_object('referee_id', OLD.referee_id, 'event_id', OLD.event_id, 'role', OLD.role, 'status', OLD.status),
      jsonb_build_object('event_id', OLD.event_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for event_assignments
CREATE TRIGGER audit_referee_assignment_insert
AFTER INSERT ON public.event_assignments
FOR EACH ROW
EXECUTE FUNCTION public.log_referee_assignment();

CREATE TRIGGER audit_referee_assignment_update
AFTER UPDATE ON public.event_assignments
FOR EACH ROW
EXECUTE FUNCTION public.log_referee_assignment();

CREATE TRIGGER audit_referee_assignment_delete
AFTER DELETE ON public.event_assignments
FOR EACH ROW
EXECUTE FUNCTION public.log_referee_assignment();

-- Trigger function for honor verification
CREATE OR REPLACE FUNCTION public.log_honor_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
    VALUES (
      CASE 
        WHEN NEW.status = 'submitted' THEN 'HONOR_SUBMITTED'
        WHEN NEW.status = 'verified' THEN 'HONOR_VERIFIED'
        WHEN NEW.status = 'rejected' THEN 'HONOR_REJECTED'
        ELSE 'HONOR_STATUS_CHANGED'
      END,
      'honors',
      NEW.id,
      COALESCE(NEW.verified_by, auth.uid()),
      jsonb_build_object('status', OLD.status, 'amount', OLD.amount),
      jsonb_build_object('status', NEW.status, 'amount', NEW.amount),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'notes', NEW.notes)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for honors
CREATE TRIGGER audit_honor_verification
AFTER UPDATE ON public.honors
FOR EACH ROW
EXECUTE FUNCTION public.log_honor_verification();

-- Function to get audit logs with actor name
CREATE OR REPLACE FUNCTION public.get_audit_logs(
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _action text DEFAULT NULL,
  _actor_id uuid DEFAULT NULL,
  _start_date timestamp with time zone DEFAULT NULL,
  _end_date timestamp with time zone DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  action text,
  entity_type text,
  entity_id uuid,
  actor_id uuid,
  actor_name text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.actor_id,
    p.full_name as actor_name,
    al.old_data,
    al.new_data,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON p.id = al.actor_id
  WHERE (_entity_type IS NULL OR al.entity_type = _entity_type)
    AND (_entity_id IS NULL OR al.entity_id = _entity_id)
    AND (_action IS NULL OR al.action = _action)
    AND (_actor_id IS NULL OR al.actor_id = _actor_id)
    AND (_start_date IS NULL OR al.created_at >= _start_date)
    AND (_end_date IS NULL OR al.created_at <= _end_date)
  ORDER BY al.created_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;