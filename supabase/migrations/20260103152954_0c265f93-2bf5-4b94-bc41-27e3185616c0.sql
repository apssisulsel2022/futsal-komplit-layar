-- =====================================================
-- GLOBAL SYSTEM RULES MIGRATION
-- =====================================================

-- 1. ADD SOFT DELETE (deleted_at) TO KEY TABLES
-- =====================================================

-- Add deleted_at to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Add deleted_at to events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Add deleted_at to honors
ALTER TABLE public.honors 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Add deleted_at to event_assignments
ALTER TABLE public.event_assignments 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_honors_deleted_at ON public.honors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_assignments_deleted_at ON public.event_assignments(deleted_at) WHERE deleted_at IS NULL;

-- 2. REGIONAL ACCESS CONTROL FUNCTIONS
-- =====================================================

-- Function to check if user is in the same region as a given kabupaten_kota_id
CREATE OR REPLACE FUNCTION public.is_same_region(_user_id uuid, _kabupaten_kota_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id 
    AND kabupaten_kota_id = _kabupaten_kota_id
  )
$$;

-- Function to check if admin_kab_kota can access a specific region
CREATE OR REPLACE FUNCTION public.can_access_region(_user_id uuid, _kabupaten_kota_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Admin provinsi can access all regions
    is_admin_provinsi(_user_id)
    OR
    -- Admin kab_kota can only access their own region
    (has_role(_user_id, 'admin_kab_kota') AND get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
    OR
    -- Users can access their own region
    (get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
$$;

-- Function to get accessible kabupaten_kota IDs for a user
CREATE OR REPLACE FUNCTION public.get_accessible_regions(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN is_admin_provinsi(_user_id) THEN 
      (SELECT id FROM public.kabupaten_kota)
    ELSE 
      (SELECT get_user_kabupaten_kota(_user_id))
  END
$$;

-- 3. SOFT DELETE FUNCTIONS
-- =====================================================

-- Function to soft delete a record
CREATE OR REPLACE FUNCTION public.soft_delete_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Instead of deleting, set deleted_at
  NEW.deleted_at = now();
  RETURN NEW;
END;
$$;

-- Function to prevent hard delete (convert to soft delete)
CREATE OR REPLACE FUNCTION public.prevent_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the record to set deleted_at instead of deleting
  EXECUTE format('UPDATE %I.%I SET deleted_at = now() WHERE id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
  USING OLD.id;
  
  -- Log the soft delete
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data)
  VALUES (
    'SOFT_DELETE',
    TG_TABLE_NAME,
    OLD.id,
    auth.uid(),
    to_jsonb(OLD)
  );
  
  -- Return NULL to prevent the actual delete
  RETURN NULL;
END;
$$;

-- 4. VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate that a user can only modify their own region's data
CREATE OR REPLACE FUNCTION public.validate_regional_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _target_region uuid;
BEGIN
  -- Get the target region from the record
  _target_region := COALESCE(NEW.kabupaten_kota_id, OLD.kabupaten_kota_id);
  
  -- Admin provinsi can access all
  IF is_admin_provinsi(_user_id) THEN
    RETURN NEW;
  END IF;
  
  -- Admin kab_kota can only modify their region
  IF has_role(_user_id, 'admin_kab_kota') THEN
    IF _target_region IS NOT NULL AND _target_region != get_user_kabupaten_kota(_user_id) THEN
      RAISE EXCEPTION 'Tidak dapat mengakses data wilayah lain';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to ensure updated_at is always set
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. APPLY TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Ensure all tables have updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_honors_updated_at ON public.honors;
CREATE TRIGGER set_honors_updated_at
BEFORE UPDATE ON public.honors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_event_assignments_updated_at ON public.event_assignments;
CREATE TRIGGER set_event_assignments_updated_at
BEFORE UPDATE ON public.event_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_kabupaten_kota_updated_at ON public.kabupaten_kota;
CREATE TRIGGER set_kabupaten_kota_updated_at
BEFORE UPDATE ON public.kabupaten_kota
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_provinsi_updated_at ON public.provinsi;
CREATE TRIGGER set_provinsi_updated_at
BEFORE UPDATE ON public.provinsi
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_pengurus_updated_at ON public.pengurus;
CREATE TRIGGER set_pengurus_updated_at
BEFORE UPDATE ON public.pengurus
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. UPDATE RLS POLICIES TO EXCLUDE SOFT-DELETED RECORDS
-- =====================================================

-- Drop and recreate policies for profiles
DROP POLICY IF EXISTS "Public can view referee profiles" ON public.profiles;
CREATE POLICY "Public can view referee profiles"
ON public.profiles FOR SELECT
USING (deleted_at IS NULL);

-- Drop and recreate policies for events
DROP POLICY IF EXISTS "Everyone can view events" ON public.events;
CREATE POLICY "Everyone can view events"
ON public.events FOR SELECT
USING (deleted_at IS NULL);

-- Update event update policy to check region
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
USING (
  deleted_at IS NULL AND (
    is_admin_provinsi(auth.uid()) 
    OR (has_role(auth.uid(), 'admin_kab_kota') AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid()))
    OR (has_role(auth.uid(), 'panitia') AND created_by = auth.uid())
  )
);

-- Update event delete policy (soft delete)
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
ON public.events FOR UPDATE
USING (
  deleted_at IS NULL AND is_admin_provinsi(auth.uid())
);

-- Update honors policies to exclude soft-deleted
DROP POLICY IF EXISTS "Admins can view all honors" ON public.honors;
CREATE POLICY "Admins can view all honors"
ON public.honors FOR SELECT
USING (deleted_at IS NULL AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Referees can view their own honors" ON public.honors;
CREATE POLICY "Referees can view their own honors"
ON public.honors FOR SELECT
USING (deleted_at IS NULL AND auth.uid() = referee_id);

DROP POLICY IF EXISTS "Referees can delete their own draft honors" ON public.honors;
CREATE POLICY "Referees can delete their own draft honors"
ON public.honors FOR UPDATE
USING (deleted_at IS NULL AND auth.uid() = referee_id AND status = 'draft');

-- Update event_assignments policies
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.event_assignments;
CREATE POLICY "Admins can view all assignments"
ON public.event_assignments FOR SELECT
USING (deleted_at IS NULL AND is_admin(auth.uid()));

DROP POLICY IF EXISTS "Referees can view their own assignments" ON public.event_assignments;
CREATE POLICY "Referees can view their own assignments"
ON public.event_assignments FOR SELECT
USING (deleted_at IS NULL AND auth.uid() = referee_id);

DROP POLICY IF EXISTS "Admins can manage assignments on approved events" ON public.event_assignments;
CREATE POLICY "Admins can manage assignments on approved events"
ON public.event_assignments FOR ALL
USING (deleted_at IS NULL AND is_admin(auth.uid()) AND is_event_approved(event_id));

-- 7. REGIONAL ACCESS VALIDATION TRIGGERS
-- =====================================================

-- Trigger to validate regional access on events
DROP TRIGGER IF EXISTS validate_event_regional_access ON public.events;
CREATE TRIGGER validate_event_regional_access
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.validate_regional_access();

-- 8. HELPER VIEW FOR ACTIVE RECORDS
-- =====================================================

-- View for active profiles (not soft-deleted)
CREATE OR REPLACE VIEW public.active_profiles AS
SELECT * FROM public.profiles WHERE deleted_at IS NULL;

-- View for active events (not soft-deleted)
CREATE OR REPLACE VIEW public.active_events AS
SELECT * FROM public.events WHERE deleted_at IS NULL;

-- View for active honors (not soft-deleted)
CREATE OR REPLACE VIEW public.active_honors AS
SELECT * FROM public.honors WHERE deleted_at IS NULL;