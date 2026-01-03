-- 1. Update get_pending_registrations to filter by regional access
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE(
  id uuid, 
  full_name text, 
  kabupaten_kota_id uuid, 
  kabupaten_kota_name text, 
  requested_role text, 
  registration_status text, 
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.requested_role,
    p.registration_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE p.registration_status = 'pending'
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.created_at ASC;
$$;

-- 2. Update get_registration_history to filter by regional access
CREATE OR REPLACE FUNCTION public.get_registration_history()
RETURNS TABLE(
  id uuid, 
  full_name text, 
  kabupaten_kota_id uuid, 
  kabupaten_kota_name text, 
  requested_role text, 
  registration_status text, 
  rejected_reason text, 
  approved_at timestamp with time zone, 
  approved_by uuid, 
  approver_name text, 
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.requested_role,
    p.registration_status,
    p.rejected_reason,
    p.approved_at,
    p.approved_by,
    approver.full_name as approver_name,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  LEFT JOIN public.profiles approver ON approver.id = p.approved_by
  WHERE p.registration_status IN ('approved', 'rejected')
    AND p.approved_at IS NOT NULL
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.approved_at DESC;
$$;

-- 3. Create trigger function for audit logging registration approval/rejection
CREATE OR REPLACE FUNCTION public.log_registration_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.registration_status IS DISTINCT FROM NEW.registration_status 
     AND NEW.registration_status IN ('approved', 'rejected') THEN
    INSERT INTO public.audit_logs (
      action, 
      entity_type, 
      entity_id, 
      actor_id, 
      old_data, 
      new_data, 
      metadata
    )
    VALUES (
      CASE 
        WHEN NEW.registration_status = 'approved' THEN 'REGISTRATION_APPROVED'
        WHEN NEW.registration_status = 'rejected' THEN 'REGISTRATION_REJECTED'
        ELSE 'REGISTRATION_STATUS_CHANGED'
      END,
      'profiles',
      NEW.id,
      COALESCE(NEW.approved_by, auth.uid()),
      jsonb_build_object('status', OLD.registration_status),
      jsonb_build_object(
        'status', NEW.registration_status, 
        'rejected_reason', NEW.rejected_reason
      ),
      jsonb_build_object(
        'full_name', NEW.full_name, 
        'requested_role', NEW.requested_role,
        'kabupaten_kota_id', NEW.kabupaten_kota_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create trigger for registration status changes
DROP TRIGGER IF EXISTS on_registration_status_change ON public.profiles;
CREATE TRIGGER on_registration_status_change
  AFTER UPDATE OF registration_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_registration_approval();

-- 5. Create function to validate regional access for approval
CREATE OR REPLACE FUNCTION public.can_approve_registration(_admin_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    is_admin_provinsi(_admin_id)
    OR (
      has_role(_admin_id, 'admin_kab_kota') 
      AND (
        SELECT kabupaten_kota_id FROM public.profiles WHERE id = _user_id
      ) = get_user_kabupaten_kota(_admin_id)
    )
$$;