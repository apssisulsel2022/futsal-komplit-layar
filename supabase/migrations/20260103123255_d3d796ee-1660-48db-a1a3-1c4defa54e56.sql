-- Add is_active column to profiles for referee status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add license_expiry for tracking license validity
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS license_expiry date;

-- Create index for common referee queries
CREATE INDEX IF NOT EXISTS idx_profiles_kabupaten_kota ON public.profiles(kabupaten_kota_id);
CREATE INDEX IF NOT EXISTS idx_profiles_license_level ON public.profiles(license_level);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Create function to get referees (users with wasit role)
CREATE OR REPLACE FUNCTION public.get_referees(
  _license_level text DEFAULT NULL,
  _is_active boolean DEFAULT NULL,
  _kabupaten_kota_id uuid DEFAULT NULL,
  _search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  birth_date date,
  kabupaten_kota_id uuid,
  kabupaten_kota_name text,
  license_level text,
  license_expiry date,
  profile_photo_url text,
  is_active boolean,
  is_profile_complete boolean,
  afk_origin text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.birth_date,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    p.license_level,
    p.license_expiry,
    p.profile_photo_url,
    p.is_active,
    p.is_profile_complete,
    p.afk_origin,
    p.created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE ur.role = 'wasit'
    AND (_license_level IS NULL OR p.license_level = _license_level)
    AND (_is_active IS NULL OR p.is_active = _is_active)
    AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_search IS NULL OR p.full_name ILIKE '%' || _search || '%')
  ORDER BY p.full_name
$$;