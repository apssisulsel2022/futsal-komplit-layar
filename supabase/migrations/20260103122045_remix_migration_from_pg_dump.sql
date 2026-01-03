CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin_provinsi',
    'admin_kab_kota',
    'panitia',
    'wasit',
    'evaluator'
);


--
-- Name: get_user_kabupaten_kota(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_kabupaten_kota(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT kabupaten_kota_id
  FROM public.profiles
  WHERE id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin_provinsi'::app_role, 'admin_kab_kota'::app_role)
  )
$$;


--
-- Name: is_admin_provinsi(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_provinsi(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin_provinsi'::app_role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_table_access_method = heap;

--
-- Name: event_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    role text DEFAULT 'referee'::text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT event_assignments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'declined'::text, 'completed'::text])))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    location text,
    category text,
    status text DEFAULT 'upcoming'::text,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT events_status_check CHECK ((status = ANY (ARRAY['upcoming'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: honors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.honors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referee_id uuid NOT NULL,
    event_id uuid,
    amount integer NOT NULL,
    notes text,
    status text DEFAULT 'draft'::text,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT honors_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: kabupaten_kota; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kabupaten_kota (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    birth_date date,
    afk_origin text,
    occupation text,
    license_level text,
    profile_photo_url text,
    license_photo_url text,
    ktp_photo_url text,
    is_profile_complete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    kabupaten_kota_id uuid,
    CONSTRAINT profiles_license_level_check CHECK ((license_level = ANY (ARRAY['level_1'::text, 'level_2'::text, 'level_3'::text])))
);


--
-- Name: referee_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referee_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referee_id uuid NOT NULL,
    reviewer_name text,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT referee_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: referee_review_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.referee_review_stats WITH (security_invoker='true') AS
 SELECT referee_id,
    (count(*))::integer AS total_reviews,
    round(avg(rating), 1) AS avg_rating
   FROM public.referee_reviews
  GROUP BY referee_id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: event_assignments event_assignments_event_id_referee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_event_id_referee_id_key UNIQUE (event_id, referee_id);


--
-- Name: event_assignments event_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: honors honors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.honors
    ADD CONSTRAINT honors_pkey PRIMARY KEY (id);


--
-- Name: kabupaten_kota kabupaten_kota_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kabupaten_kota
    ADD CONSTRAINT kabupaten_kota_code_key UNIQUE (code);


--
-- Name: kabupaten_kota kabupaten_kota_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kabupaten_kota
    ADD CONSTRAINT kabupaten_kota_name_key UNIQUE (name);


--
-- Name: kabupaten_kota kabupaten_kota_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kabupaten_kota
    ADD CONSTRAINT kabupaten_kota_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: referee_reviews referee_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referee_reviews
    ADD CONSTRAINT referee_reviews_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: event_assignments update_event_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_event_assignments_updated_at BEFORE UPDATE ON public.event_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: honors update_honors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_honors_updated_at BEFORE UPDATE ON public.honors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_assignments event_assignments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_assignments event_assignments_referee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_assignments
    ADD CONSTRAINT event_assignments_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: honors honors_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.honors
    ADD CONSTRAINT honors_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: honors honors_referee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.honors
    ADD CONSTRAINT honors_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: honors honors_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.honors
    ADD CONSTRAINT honors_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_kabupaten_kota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_kabupaten_kota_id_fkey FOREIGN KEY (kabupaten_kota_id) REFERENCES public.kabupaten_kota(id);


--
-- Name: referee_reviews referee_reviews_referee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referee_reviews
    ADD CONSTRAINT referee_reviews_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Admin kab_kota can update profiles in their region; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin kab_kota can update profiles in their region" ON public.profiles FOR UPDATE USING ((public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role) AND (kabupaten_kota_id = public.get_user_kabupaten_kota(auth.uid()))));


--
-- Name: profiles Admin kab_kota can view profiles in their region; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin kab_kota can view profiles in their region" ON public.profiles FOR SELECT USING ((public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role) AND (kabupaten_kota_id = public.get_user_kabupaten_kota(auth.uid()))));


--
-- Name: profiles Admin provinsi can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin_provinsi(auth.uid()));


--
-- Name: kabupaten_kota Admin provinsi can manage kabupaten_kota; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can manage kabupaten_kota" ON public.kabupaten_kota USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: user_roles Admin provinsi can manage user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can manage user_roles" ON public.user_roles USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: profiles Admin provinsi can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: profiles Admin provinsi can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: events Admins can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create events" ON public.events FOR INSERT WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: events Admins can delete events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: event_assignments Admins can manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assignments" ON public.event_assignments USING (public.is_admin(auth.uid()));


--
-- Name: honors Admins can update all honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all honors" ON public.honors FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: events Admins can update events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: event_assignments Admins can view all assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all assignments" ON public.event_assignments FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: honors Admins can view all honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all honors" ON public.honors FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: referee_reviews Anyone can submit reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit reviews" ON public.referee_reviews FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: referee_reviews Anyone can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view reviews" ON public.referee_reviews FOR SELECT TO authenticated, anon USING (true);


--
-- Name: events Everyone can view events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view events" ON public.events FOR SELECT TO authenticated USING (true);


--
-- Name: kabupaten_kota Everyone can view kabupaten_kota; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view kabupaten_kota" ON public.kabupaten_kota FOR SELECT USING (true);


--
-- Name: profiles Public can view referee profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view referee profiles" ON public.profiles FOR SELECT TO anon USING (true);


--
-- Name: honors Referees can create their own honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can create their own honors" ON public.honors FOR INSERT WITH CHECK ((auth.uid() = referee_id));


--
-- Name: honors Referees can delete their own draft honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can delete their own draft honors" ON public.honors FOR DELETE USING (((auth.uid() = referee_id) AND (status = 'draft'::text)));


--
-- Name: honors Referees can update their own draft honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can update their own draft honors" ON public.honors FOR UPDATE USING (((auth.uid() = referee_id) AND (status = 'draft'::text)));


--
-- Name: event_assignments Referees can view their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can view their own assignments" ON public.event_assignments FOR SELECT USING ((auth.uid() = referee_id));


--
-- Name: honors Referees can view their own honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can view their own honors" ON public.honors FOR SELECT USING ((auth.uid() = referee_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: event_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: honors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.honors ENABLE ROW LEVEL SECURITY;

--
-- Name: kabupaten_kota; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kabupaten_kota ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: referee_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referee_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;