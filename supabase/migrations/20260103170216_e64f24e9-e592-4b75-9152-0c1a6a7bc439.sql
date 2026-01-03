-- Update get_referees function with regional access control
CREATE OR REPLACE FUNCTION public.get_referees(
  _license_level text DEFAULT NULL::text,
  _is_active boolean DEFAULT NULL::boolean,
  _kabupaten_kota_id uuid DEFAULT NULL::uuid,
  _search text DEFAULT NULL::text
)
RETURNS TABLE(
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
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
    AND p.deleted_at IS NULL
    -- Regional access control
    AND (
      is_admin_provinsi(auth.uid())  -- Admin Provinsi sees all
      OR p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())  -- Others only see their region
    )
    -- Existing filters
    AND (_license_level IS NULL OR p.license_level = _license_level)
    AND (_is_active IS NULL OR p.is_active = _is_active)
    AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_search IS NULL OR p.full_name ILIKE '%' || _search || '%')
  ORDER BY p.full_name
$$;