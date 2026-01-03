
-- Update license_level constraint to match actual usage
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_license_level_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_license_level_check 
CHECK (license_level IS NULL OR license_level IN ('Lisensi A', 'Lisensi B', 'Lisensi C', 'Lisensi D', 'level_1', 'level_2', 'level_3'));
