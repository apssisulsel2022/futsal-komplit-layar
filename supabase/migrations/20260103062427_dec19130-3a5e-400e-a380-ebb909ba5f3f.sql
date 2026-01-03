
-- Drop ALL existing policies on all tables that might use old functions
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all honors" ON public.honors;
DROP POLICY IF EXISTS "Admins can view all honors" ON public.honors;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;

-- Drop functions with CASCADE
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_provinsi(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_kabupaten_kota(uuid) CASCADE;

-- Rename old enum type
ALTER TYPE public.app_role RENAME TO app_role_old;

-- Create new enum type with new values
CREATE TYPE public.app_role AS ENUM ('admin_provinsi', 'admin_kab_kota', 'panitia', 'wasit', 'evaluator');

-- Migrate data in user_roles table
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING (
    CASE role::text
      WHEN 'admin' THEN 'admin_provinsi'::public.app_role
      WHEN 'referee' THEN 'wasit'::public.app_role
      ELSE 'wasit'::public.app_role
    END
  );

-- Drop old enum type
DROP TYPE public.app_role_old;
