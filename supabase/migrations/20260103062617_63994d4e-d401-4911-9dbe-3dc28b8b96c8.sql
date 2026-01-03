
-- Create all helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin_provinsi'::app_role, 'admin_kab_kota'::app_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin_provinsi(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_provinsi'::app_role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_kabupaten_kota(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT kabupaten_kota_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Update handle_new_user to not auto-assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$function$;

-- RLS for kabupaten_kota
CREATE POLICY "Everyone can view kabupaten_kota"
ON public.kabupaten_kota FOR SELECT
USING (true);

CREATE POLICY "Admin provinsi can manage kabupaten_kota"
ON public.kabupaten_kota FOR ALL
USING (is_admin_provinsi(auth.uid()));

-- RLS for profiles  
CREATE POLICY "Admin provinsi can view all profiles"
ON public.profiles FOR SELECT
USING (is_admin_provinsi(auth.uid()));

CREATE POLICY "Admin provinsi can update all profiles"
ON public.profiles FOR UPDATE
USING (is_admin_provinsi(auth.uid()));

CREATE POLICY "Admin kab_kota can view profiles in their region"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin_kab_kota'::app_role)
  AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
);

CREATE POLICY "Admin kab_kota can update profiles in their region"
ON public.profiles FOR UPDATE
USING (
  has_role(auth.uid(), 'admin_kab_kota'::app_role)
  AND kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
);

-- RLS for events
CREATE POLICY "Admins can create events"
ON public.events FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
USING (is_admin_provinsi(auth.uid()));

-- RLS for event_assignments
CREATE POLICY "Admins can manage assignments"
ON public.event_assignments FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all assignments"
ON public.event_assignments FOR SELECT
USING (is_admin(auth.uid()));

-- RLS for honors
CREATE POLICY "Admins can view all honors"
ON public.honors FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all honors"
ON public.honors FOR UPDATE
USING (is_admin(auth.uid()));

-- Storage policy
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND is_admin(auth.uid()));

-- Insert kabupaten/kota data
INSERT INTO public.kabupaten_kota (name, code) VALUES
  ('Kota Makassar', 'MKS'),
  ('Kota Parepare', 'PRE'),
  ('Kota Palopo', 'PLP'),
  ('Kabupaten Gowa', 'GWA'),
  ('Kabupaten Maros', 'MRS'),
  ('Kabupaten Bone', 'BNE'),
  ('Kabupaten Wajo', 'WJO'),
  ('Kabupaten Soppeng', 'SPG'),
  ('Kabupaten Barru', 'BRU'),
  ('Kabupaten Pangkep', 'PKP'),
  ('Kabupaten Pinrang', 'PRG'),
  ('Kabupaten Sidrap', 'SDR'),
  ('Kabupaten Enrekang', 'ERK'),
  ('Kabupaten Luwu', 'LWU'),
  ('Kabupaten Luwu Utara', 'LUT'),
  ('Kabupaten Luwu Timur', 'LTM'),
  ('Kabupaten Tana Toraja', 'TRT'),
  ('Kabupaten Toraja Utara', 'TRU'),
  ('Kabupaten Takalar', 'TKL'),
  ('Kabupaten Jeneponto', 'JNP'),
  ('Kabupaten Bantaeng', 'BTG'),
  ('Kabupaten Bulukumba', 'BLK'),
  ('Kabupaten Sinjai', 'SNJ'),
  ('Kabupaten Selayar', 'SLY')
ON CONFLICT (name) DO NOTHING;
