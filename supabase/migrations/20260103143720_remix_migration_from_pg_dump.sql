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
-- Name: pengurus_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pengurus_level AS ENUM (
    'PROVINSI',
    'KAB_KOTA'
);


--
-- Name: get_honor_statistics(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_honor_statistics(_referee_id uuid DEFAULT NULL::uuid) RETURNS TABLE(referee_id uuid, total_verified bigint, total_pending bigint, total_rejected bigint, total_earned bigint, pending_amount bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    h.referee_id,
    COUNT(*) FILTER (WHERE h.status = 'verified') as total_verified,
    COUNT(*) FILTER (WHERE h.status = 'submitted') as total_pending,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as total_rejected,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_earned,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0) as pending_amount
  FROM public.honors h
  WHERE (_referee_id IS NULL OR h.referee_id = _referee_id)
  GROUP BY h.referee_id
$$;


--
-- Name: get_referees(text, boolean, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_referees(_license_level text DEFAULT NULL::text, _is_active boolean DEFAULT NULL::boolean, _kabupaten_kota_id uuid DEFAULT NULL::uuid, _search text DEFAULT NULL::text) RETURNS TABLE(id uuid, full_name text, birth_date date, kabupaten_kota_id uuid, kabupaten_kota_name text, license_level text, license_expiry date, profile_photo_url text, is_active boolean, is_profile_complete boolean, afk_origin text, created_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
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
    AND (_license_level IS NULL OR p.license_level = _license_level)
    AND (_is_active IS NULL OR p.is_active = _is_active)
    AND (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_search IS NULL OR p.full_name ILIKE '%' || _search || '%')
  ORDER BY p.full_name
$$;


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
-- Name: handle_honor_verification(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_honor_verification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- When status changes to verified or rejected, set verification info
  IF NEW.status IN ('verified', 'rejected') AND OLD.status != NEW.status THEN
    NEW.verified_at = now();
    -- verified_by should be set by the caller
  END IF;
  
  -- Clear verification info if going back to draft
  IF NEW.status = 'draft' AND OLD.status != 'draft' THEN
    NEW.verified_at = NULL;
    NEW.verified_by = NULL;
  END IF;
  
  RETURN NEW;
END;
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
-- Name: has_schedule_conflict(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_schedule_conflict(_referee_id uuid, _event_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_assignments ea
    INNER JOIN public.events e ON e.id = ea.event_id
    WHERE ea.referee_id = _referee_id
      AND ea.event_id != _event_id
      AND e.date = (SELECT date FROM public.events WHERE id = _event_id)
      AND ea.status != 'cancelled'
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
-- Name: is_event_approved(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_event_approved(_event_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND status = 'DISETUJUI'
  )
$$;


--
-- Name: is_referee_active(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_referee_active(_referee_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = _referee_id
      AND ur.role = 'wasit'
      AND p.is_active = true
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


--
-- Name: validate_honor_submission(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_honor_submission() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- For new honors, check if referee is assigned to the event
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.event_assignments
        WHERE event_id = NEW.event_id
          AND referee_id = NEW.referee_id
          AND status != 'cancelled'
      ) THEN
        RAISE EXCEPTION 'Wasit tidak ditugaskan ke event ini';
      END IF;
    END IF;
  END IF;
  
  -- Prevent editing amount after submission (admin cannot change wasit input)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'draft' AND NEW.amount != OLD.amount THEN
      RAISE EXCEPTION 'Tidak dapat mengubah jumlah honor setelah disubmit';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_referee_assignment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_referee_assignment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Check if event is approved
  IF NOT is_event_approved(NEW.event_id) THEN
    RAISE EXCEPTION 'Cannot assign referee to unapproved event';
  END IF;
  
  -- Check if referee is active
  IF NOT is_referee_active(NEW.referee_id) THEN
    RAISE EXCEPTION 'Cannot assign inactive referee';
  END IF;
  
  -- Check for schedule conflict
  IF has_schedule_conflict(NEW.referee_id, NEW.event_id) THEN
    RAISE EXCEPTION 'Referee has schedule conflict on this date';
  END IF;
  
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: event_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    action text NOT NULL,
    from_status text,
    to_status text NOT NULL,
    notes text,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT event_approvals_action_check CHECK ((action = ANY (ARRAY['SUBMIT'::text, 'APPROVE'::text, 'REJECT'::text, 'COMPLETE'::text, 'REVISION_REQUEST'::text])))
);


--
-- Name: event_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    referee_id uuid NOT NULL,
    role text DEFAULT 'CADANGAN'::text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT event_assignments_role_check CHECK ((role = ANY (ARRAY['UTAMA'::text, 'CADANGAN'::text]))),
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
    status text DEFAULT 'DIAJUKAN'::text,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    kabupaten_kota_id uuid,
    CONSTRAINT events_status_check CHECK ((status = ANY (ARRAY['DIAJUKAN'::text, 'DISETUJUI'::text, 'DITOLAK'::text, 'SELESAI'::text])))
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
    updated_at timestamp with time zone DEFAULT now(),
    provinsi_id uuid
);


--
-- Name: pengurus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pengurus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    level public.pengurus_level NOT NULL,
    jabatan text NOT NULL,
    provinsi_id uuid,
    kabupaten_kota_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pengurus_level_check CHECK ((((level = 'PROVINSI'::public.pengurus_level) AND (provinsi_id IS NOT NULL) AND (kabupaten_kota_id IS NULL)) OR ((level = 'KAB_KOTA'::public.pengurus_level) AND (kabupaten_kota_id IS NOT NULL))))
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
    is_active boolean DEFAULT true,
    license_expiry date,
    CONSTRAINT profiles_license_level_check CHECK (((license_level IS NULL) OR (license_level = ANY (ARRAY['Lisensi A'::text, 'Lisensi B'::text, 'Lisensi C'::text, 'Lisensi D'::text, 'level_1'::text, 'level_2'::text, 'level_3'::text]))))
);


--
-- Name: provinsi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provinsi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
-- Name: event_approvals event_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_approvals
    ADD CONSTRAINT event_approvals_pkey PRIMARY KEY (id);


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
-- Name: pengurus pengurus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengurus
    ADD CONSTRAINT pengurus_pkey PRIMARY KEY (id);


--
-- Name: pengurus pengurus_user_id_level_provinsi_id_kabupaten_kota_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengurus
    ADD CONSTRAINT pengurus_user_id_level_provinsi_id_kabupaten_kota_id_key UNIQUE (user_id, level, provinsi_id, kabupaten_kota_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: provinsi provinsi_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provinsi
    ADD CONSTRAINT provinsi_code_key UNIQUE (code);


--
-- Name: provinsi provinsi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provinsi
    ADD CONSTRAINT provinsi_pkey PRIMARY KEY (id);


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
-- Name: idx_event_assignments_referee_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_assignments_referee_status ON public.event_assignments USING btree (referee_id, status);


--
-- Name: idx_honors_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_honors_event ON public.honors USING btree (event_id);


--
-- Name: idx_honors_referee_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_honors_referee_status ON public.honors USING btree (referee_id, status);


--
-- Name: idx_profiles_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);


--
-- Name: idx_profiles_kabupaten_kota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_kabupaten_kota ON public.profiles USING btree (kabupaten_kota_id);


--
-- Name: idx_profiles_license_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_license_level ON public.profiles USING btree (license_level);


--
-- Name: honors handle_honor_verification_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_honor_verification_trigger BEFORE UPDATE ON public.honors FOR EACH ROW EXECUTE FUNCTION public.handle_honor_verification();


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
-- Name: pengurus update_pengurus_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pengurus_updated_at BEFORE UPDATE ON public.pengurus FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: provinsi update_provinsi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_provinsi_updated_at BEFORE UPDATE ON public.provinsi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_assignments validate_assignment_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_assignment_trigger BEFORE INSERT OR UPDATE ON public.event_assignments FOR EACH ROW EXECUTE FUNCTION public.validate_referee_assignment();


--
-- Name: honors validate_honor_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_honor_trigger BEFORE INSERT OR UPDATE ON public.honors FOR EACH ROW EXECUTE FUNCTION public.validate_honor_submission();


--
-- Name: event_approvals event_approvals_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_approvals
    ADD CONSTRAINT event_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: event_approvals event_approvals_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_approvals
    ADD CONSTRAINT event_approvals_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


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
-- Name: events events_kabupaten_kota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_kabupaten_kota_id_fkey FOREIGN KEY (kabupaten_kota_id) REFERENCES public.kabupaten_kota(id) ON DELETE SET NULL;


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
-- Name: kabupaten_kota kabupaten_kota_provinsi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kabupaten_kota
    ADD CONSTRAINT kabupaten_kota_provinsi_id_fkey FOREIGN KEY (provinsi_id) REFERENCES public.provinsi(id) ON DELETE SET NULL;


--
-- Name: pengurus pengurus_kabupaten_kota_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengurus
    ADD CONSTRAINT pengurus_kabupaten_kota_id_fkey FOREIGN KEY (kabupaten_kota_id) REFERENCES public.kabupaten_kota(id) ON DELETE CASCADE;


--
-- Name: pengurus pengurus_provinsi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengurus
    ADD CONSTRAINT pengurus_provinsi_id_fkey FOREIGN KEY (provinsi_id) REFERENCES public.provinsi(id) ON DELETE CASCADE;


--
-- Name: pengurus pengurus_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengurus
    ADD CONSTRAINT pengurus_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


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
-- Name: events Admin and panitia can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and panitia can create events" ON public.events FOR INSERT WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'panitia'::public.app_role)));


--
-- Name: event_approvals Admin can insert approvals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert approvals" ON public.event_approvals FOR INSERT WITH CHECK ((public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'panitia'::public.app_role)));


--
-- Name: pengurus Admin kab_kota can manage pengurus in their region; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin kab_kota can manage pengurus in their region" ON public.pengurus USING ((public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role) AND (level = 'KAB_KOTA'::public.pengurus_level) AND (kabupaten_kota_id = public.get_user_kabupaten_kota(auth.uid()))));


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
-- Name: pengurus Admin provinsi can manage all pengurus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can manage all pengurus" ON public.pengurus USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: kabupaten_kota Admin provinsi can manage kabupaten_kota; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can manage kabupaten_kota" ON public.kabupaten_kota USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: provinsi Admin provinsi can manage provinsi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin provinsi can manage provinsi" ON public.provinsi USING (public.is_admin_provinsi(auth.uid()));


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
-- Name: events Admins can delete events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin_provinsi(auth.uid()));


--
-- Name: event_assignments Admins can manage assignments on approved events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assignments on approved events" ON public.event_assignments USING ((public.is_admin(auth.uid()) AND public.is_event_approved(event_id)));


--
-- Name: honors Admins can update all honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all honors" ON public.honors FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: events Admins can update events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING ((public.is_admin(auth.uid()) OR (public.has_role(auth.uid(), 'panitia'::public.app_role) AND (created_by = auth.uid()))));


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
-- Name: event_approvals Everyone can view event approvals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view event approvals" ON public.event_approvals FOR SELECT USING (true);


--
-- Name: events Everyone can view events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view events" ON public.events FOR SELECT TO authenticated USING (true);


--
-- Name: kabupaten_kota Everyone can view kabupaten_kota; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view kabupaten_kota" ON public.kabupaten_kota FOR SELECT USING (true);


--
-- Name: pengurus Everyone can view pengurus; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view pengurus" ON public.pengurus FOR SELECT USING (true);


--
-- Name: provinsi Everyone can view provinsi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view provinsi" ON public.provinsi FOR SELECT USING (true);


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
-- Name: event_approvals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_approvals ENABLE ROW LEVEL SECURITY;

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
-- Name: pengurus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pengurus ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: provinsi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provinsi ENABLE ROW LEVEL SECURITY;

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