-- Update handle_new_user function to read metadata and set pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    kabupaten_kota_id,
    requested_role,
    registration_status,
    is_profile_complete,
    is_active
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    (new.raw_user_meta_data->>'kabupaten_kota_id')::uuid,
    new.raw_user_meta_data->>'requested_role',
    'pending',
    false,
    true
  );
  RETURN new;
END;
$$;