-- Add RLS policy for admin_provinsi to manage user_roles
CREATE POLICY "Admin provinsi can manage user_roles"
ON public.user_roles FOR ALL
USING (is_admin_provinsi(auth.uid()));

-- Add RLS policy for admin_provinsi to insert profiles (for new users)
CREATE POLICY "Admin provinsi can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (is_admin_provinsi(auth.uid()));