-- Add registration flow columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS requested_role text,
ADD COLUMN IF NOT EXISTS rejected_reason text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);

-- Update existing profiles to have approved status
UPDATE public.profiles SET registration_status = 'approved' WHERE registration_status IS NULL;

-- Create index for faster queries on registration status
CREATE INDEX IF NOT EXISTS idx_profiles_registration_status ON public.profiles(registration_status);

-- Update RLS policy to allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile during signup"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create function to get pending registrations (for admin)
CREATE OR REPLACE FUNCTION public.get_pending_registrations()
RETURNS TABLE (
  id uuid,
  full_name text,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  requested_role text,
  registration_status text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
  ORDER BY p.created_at ASC
$$;

-- Create function to get registration history (for admin)
CREATE OR REPLACE FUNCTION public.get_registration_history()
RETURNS TABLE (
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
STABLE
SECURITY DEFINER
SET search_path = public
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
  ORDER BY p.approved_at DESC
$$;