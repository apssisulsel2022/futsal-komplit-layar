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
-- Name: can_access_region(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_region(_user_id uuid, _kabupaten_kota_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    -- Admin provinsi can access all regions
    is_admin_provinsi(_user_id)
    OR
    -- Admin kab_kota can only access their own region
    (has_role(_user_id, 'admin_kab_kota') AND get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
    OR
    -- Users can access their own region
    (get_user_kabupaten_kota(_user_id) = _kabupaten_kota_id)
$$;


--
-- Name: can_approve_registration(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_approve_registration(_admin_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    is_admin_provinsi(_admin_id)
    OR (
      has_role(_admin_id, 'admin_kab_kota') 
      AND (
        SELECT kabupaten_kota_id FROM public.profiles WHERE id = _user_id
      ) = get_user_kabupaten_kota(_admin_id)
    )
$$;


--
-- Name: get_accessible_regions(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_accessible_regions(_user_id uuid) RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT CASE 
    WHEN is_admin_provinsi(_user_id) THEN 
      (SELECT id FROM public.kabupaten_kota)
    ELSE 
      (SELECT get_user_kabupaten_kota(_user_id))
  END
$$;


--
-- Name: get_admin_dashboard_summary(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_dashboard_summary(_kabupaten_kota_id uuid DEFAULT NULL::uuid, _start_date date DEFAULT NULL::date, _end_date date DEFAULT NULL::date) RETURNS TABLE(total_referees bigint, active_referees bigint, total_events bigint, completed_events bigint, total_verified_income bigint, total_pending_income bigint, avg_income_per_referee numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH referee_stats AS (
    SELECT 
      COUNT(DISTINCT p.id) as total_referees,
      COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) as active_referees
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
    WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
  ),
  event_stats AS (
    SELECT 
      COUNT(DISTINCT e.id) as total_events,
      COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'SELESAI') as completed_events
    FROM public.events e
    WHERE (_kabupaten_kota_id IS NULL OR e.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR e.date >= _start_date)
      AND (_end_date IS NULL OR e.date <= _end_date)
  ),
  income_stats AS (
    SELECT 
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0) as total_verified_income,
      COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0) as total_pending_income
    FROM public.honors h
    LEFT JOIN public.events e ON e.id = h.event_id
    LEFT JOIN public.profiles p ON p.id = h.referee_id
    WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
      AND (_start_date IS NULL OR e.date >= _start_date OR h.event_id IS NULL)
      AND (_end_date IS NULL OR e.date <= _end_date OR h.event_id IS NULL)
  )
  SELECT 
    rs.total_referees,
    rs.active_referees,
    es.total_events,
    es.completed_events,
    ins.total_verified_income::bigint,
    ins.total_pending_income::bigint,
    CASE WHEN rs.total_referees > 0 
      THEN ROUND(ins.total_verified_income::numeric / rs.total_referees, 2)
      ELSE 0 
    END as avg_income_per_referee
  FROM referee_stats rs, event_stats es, income_stats ins;
$$;


--
-- Name: get_audit_logs(text, uuid, text, uuid, timestamp with time zone, timestamp with time zone, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_audit_logs(_entity_type text DEFAULT NULL::text, _entity_id uuid DEFAULT NULL::uuid, _action text DEFAULT NULL::text, _actor_id uuid DEFAULT NULL::uuid, _start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, _end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, _limit integer DEFAULT 100, _offset integer DEFAULT 0) RETURNS TABLE(id uuid, action text, entity_type text, entity_id uuid, actor_id uuid, actor_name text, old_data jsonb, new_data jsonb, metadata jsonb, created_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    al.id,
    al.action,
    al.entity_type,
    al.entity_id,
    al.actor_id,
    p.full_name as actor_name,
    al.old_data,
    al.new_data,
    al.metadata,
    al.created_at
  FROM public.audit_logs al
  LEFT JOIN public.profiles p ON p.id = al.actor_id
  WHERE (_entity_type IS NULL OR al.entity_type = _entity_type)
    AND (_entity_id IS NULL OR al.entity_id = _entity_id)
    AND (_action IS NULL OR al.action = _action)
    AND (_actor_id IS NULL OR al.actor_id = _actor_id)
    AND (_start_date IS NULL OR al.created_at >= _start_date)
    AND (_end_date IS NULL OR al.created_at <= _end_date)
  ORDER BY al.created_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;


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
-- Name: get_pending_registrations(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pending_registrations() RETURNS TABLE(id uuid, full_name text, kabupaten_kota_id uuid, kabupaten_kota_name text, requested_role text, registration_status text, created_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.created_at ASC;
$$;


--
-- Name: get_referee_event_count(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_referee_event_count(_kabupaten_kota_id uuid DEFAULT NULL::uuid, _start_date date DEFAULT NULL::date, _end_date date DEFAULT NULL::date) RETURNS TABLE(referee_id uuid, referee_name text, kabupaten_kota_id uuid, kabupaten_kota_name text, total_events bigint, completed_events bigint, pending_events bigint, cancelled_events bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    p.id as referee_id,
    p.full_name as referee_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    COUNT(DISTINCT ea.event_id) as total_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'completed') as completed_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'pending' OR ea.status = 'confirmed') as pending_events,
    COUNT(DISTINCT ea.event_id) FILTER (WHERE ea.status = 'cancelled') as cancelled_events
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
  LEFT JOIN public.event_assignments ea ON ea.referee_id = p.id
  LEFT JOIN public.events e ON e.id = ea.event_id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.date >= _start_date OR ea.event_id IS NULL)
    AND (_end_date IS NULL OR e.date <= _end_date OR ea.event_id IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_events DESC;
$$;


--
-- Name: get_referee_income_summary(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_referee_income_summary(_kabupaten_kota_id uuid DEFAULT NULL::uuid, _start_date date DEFAULT NULL::date, _end_date date DEFAULT NULL::date) RETURNS TABLE(referee_id uuid, referee_name text, kabupaten_kota_id uuid, kabupaten_kota_name text, total_verified_income bigint, total_pending_income bigint, verified_count bigint, pending_count bigint, rejected_count bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    p.id as referee_id,
    p.full_name as referee_name,
    p.kabupaten_kota_id,
    kk.name as kabupaten_kota_name,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'verified'), 0)::bigint as total_verified_income,
    COALESCE(SUM(h.amount) FILTER (WHERE h.status = 'submitted'), 0)::bigint as total_pending_income,
    COUNT(*) FILTER (WHERE h.status = 'verified') as verified_count,
    COUNT(*) FILTER (WHERE h.status = 'submitted') as pending_count,
    COUNT(*) FILTER (WHERE h.status = 'rejected') as rejected_count
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'wasit'
  LEFT JOIN public.honors h ON h.referee_id = p.id
  LEFT JOIN public.events e ON e.id = h.event_id
  LEFT JOIN public.kabupaten_kota kk ON kk.id = p.kabupaten_kota_id
  WHERE (_kabupaten_kota_id IS NULL OR p.kabupaten_kota_id = _kabupaten_kota_id)
    AND (_start_date IS NULL OR e.date >= _start_date OR h.event_id IS NULL)
    AND (_end_date IS NULL OR e.date <= _end_date OR h.event_id IS NULL)
  GROUP BY p.id, p.full_name, p.kabupaten_kota_id, kk.name
  ORDER BY total_verified_income DESC;
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
-- Name: get_registration_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_registration_history() RETURNS TABLE(id uuid, full_name text, kabupaten_kota_id uuid, kabupaten_kota_name text, requested_role text, registration_status text, rejected_reason text, approved_at timestamp with time zone, approved_by uuid, approver_name text, created_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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
    AND (
      is_admin_provinsi(auth.uid())
      OR (
        has_role(auth.uid(), 'admin_kab_kota') 
        AND p.kabupaten_kota_id = get_user_kabupaten_kota(auth.uid())
      )
    )
  ORDER BY p.approved_at DESC;
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
-- Name: is_same_region(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_same_region(_user_id uuid, _kabupaten_kota_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id 
    AND kabupaten_kota_id = _kabupaten_kota_id
  )
$$;


--
-- Name: log_event_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_event_approval() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
  VALUES (
    'EVENT_APPROVAL',
    'events',
    NEW.event_id,
    NEW.approved_by,
    jsonb_build_object('from_status', NEW.from_status),
    jsonb_build_object('to_status', NEW.to_status, 'action', NEW.action),
    jsonb_build_object('notes', NEW.notes, 'approval_id', NEW.id)
  );
  RETURN NEW;
END;
$$;


--
-- Name: log_honor_verification(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_honor_verification() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
    VALUES (
      CASE 
        WHEN NEW.status = 'submitted' THEN 'HONOR_SUBMITTED'
        WHEN NEW.status = 'verified' THEN 'HONOR_VERIFIED'
        WHEN NEW.status = 'rejected' THEN 'HONOR_REJECTED'
        ELSE 'HONOR_STATUS_CHANGED'
      END,
      'honors',
      NEW.id,
      COALESCE(NEW.verified_by, auth.uid()),
      jsonb_build_object('status', OLD.status, 'amount', OLD.amount),
      jsonb_build_object('status', NEW.status, 'amount', NEW.amount),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'notes', NEW.notes)
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: log_referee_assignment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_referee_assignment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, new_data, metadata)
    VALUES (
      'REFEREE_ASSIGNED',
      'event_assignments',
      NEW.id,
      auth.uid(),
      jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id, 'role', NEW.role, 'status', NEW.status),
      jsonb_build_object('event_id', NEW.event_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, new_data, metadata)
      VALUES (
        'REFEREE_ASSIGNMENT_UPDATED',
        'event_assignments',
        NEW.id,
        auth.uid(),
        jsonb_build_object('status', OLD.status, 'role', OLD.role),
        jsonb_build_object('status', NEW.status, 'role', NEW.role),
        jsonb_build_object('referee_id', NEW.referee_id, 'event_id', NEW.event_id)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data, metadata)
    VALUES (
      'REFEREE_UNASSIGNED',
      'event_assignments',
      OLD.id,
      auth.uid(),
      jsonb_build_object('referee_id', OLD.referee_id, 'event_id', OLD.event_id, 'role', OLD.role, 'status', OLD.status),
      jsonb_build_object('event_id', OLD.event_id)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: log_registration_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_registration_approval() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.registration_status IS DISTINCT FROM NEW.registration_status 
     AND NEW.registration_status IN ('approved', 'rejected') THEN
    INSERT INTO public.audit_logs (
      action, 
      entity_type, 
      entity_id, 
      actor_id, 
      old_data, 
      new_data, 
      metadata
    )
    VALUES (
      CASE 
        WHEN NEW.registration_status = 'approved' THEN 'REGISTRATION_APPROVED'
        WHEN NEW.registration_status = 'rejected' THEN 'REGISTRATION_REJECTED'
        ELSE 'REGISTRATION_STATUS_CHANGED'
      END,
      'profiles',
      NEW.id,
      COALESCE(NEW.approved_by, auth.uid()),
      jsonb_build_object('status', OLD.registration_status),
      jsonb_build_object(
        'status', NEW.registration_status, 
        'rejected_reason', NEW.rejected_reason
      ),
      jsonb_build_object(
        'full_name', NEW.full_name, 
        'requested_role', NEW.requested_role,
        'kabupaten_kota_id', NEW.kabupaten_kota_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: prevent_hard_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_hard_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
BEGIN
  -- Update the record to set deleted_at instead of deleting
  EXECUTE format('UPDATE %I.%I SET deleted_at = now() WHERE id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
  USING OLD.id;
  
  -- Log the soft delete
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, old_data)
  VALUES (
    'SOFT_DELETE',
    TG_TABLE_NAME,
    OLD.id,
    auth.uid(),
    to_jsonb(OLD)
  );
  
  -- Return NULL to prevent the actual delete
  RETURN NULL;
END;
$_$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: soft_delete_record(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.soft_delete_record() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Instead of deleting, set deleted_at
  NEW.deleted_at = now();
  RETURN NEW;
END;
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


--
-- Name: validate_regional_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_regional_access() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _user_id uuid := auth.uid();
  _target_region uuid;
BEGIN
  -- Get the target region from the record
  _target_region := COALESCE(NEW.kabupaten_kota_id, OLD.kabupaten_kota_id);
  
  -- Admin provinsi can access all
  IF is_admin_provinsi(_user_id) THEN
    RETURN NEW;
  END IF;
  
  -- Admin kab_kota can only modify their region
  IF has_role(_user_id, 'admin_kab_kota') THEN
    IF _target_region IS NOT NULL AND _target_region != get_user_kabupaten_kota(_user_id) THEN
      RAISE EXCEPTION 'Tidak dapat mengakses data wilayah lain';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

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
    deleted_at timestamp with time zone,
    CONSTRAINT events_status_check CHECK ((status = ANY (ARRAY['DIAJUKAN'::text, 'DISETUJUI'::text, 'DITOLAK'::text, 'SELESAI'::text])))
);


--
-- Name: active_events; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_events WITH (security_invoker='true') AS
 SELECT id,
    name,
    date,
    location,
    category,
    status,
    description,
    created_by,
    created_at,
    updated_at,
    kabupaten_kota_id,
    deleted_at
   FROM public.events
  WHERE (deleted_at IS NULL);


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
    deleted_at timestamp with time zone,
    CONSTRAINT honors_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: active_honors; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_honors WITH (security_invoker='true') AS
 SELECT id,
    referee_id,
    event_id,
    amount,
    notes,
    status,
    verified_by,
    verified_at,
    created_at,
    updated_at,
    deleted_at
   FROM public.honors
  WHERE (deleted_at IS NULL);


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
    registration_status text DEFAULT 'approved'::text,
    requested_role text,
    rejected_reason text,
    approved_at timestamp with time zone,
    approved_by uuid,
    deleted_at timestamp with time zone,
    CONSTRAINT profiles_license_level_check CHECK (((license_level IS NULL) OR (license_level = ANY (ARRAY['Lisensi A'::text, 'Lisensi B'::text, 'Lisensi C'::text, 'Lisensi D'::text, 'level_1'::text, 'level_2'::text, 'level_3'::text]))))
);


--
-- Name: active_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_profiles WITH (security_invoker='true') AS
 SELECT id,
    full_name,
    birth_date,
    afk_origin,
    occupation,
    license_level,
    profile_photo_url,
    license_photo_url,
    ktp_photo_url,
    is_profile_complete,
    created_at,
    updated_at,
    kabupaten_kota_id,
    is_active,
    license_expiry,
    registration_status,
    requested_role,
    rejected_reason,
    approved_at,
    approved_by,
    deleted_at
   FROM public.profiles
  WHERE (deleted_at IS NULL);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    actor_id uuid,
    old_data jsonb,
    new_data jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


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
    deleted_at timestamp with time zone,
    CONSTRAINT event_assignments_role_check CHECK ((role = ANY (ARRAY['UTAMA'::text, 'CADANGAN'::text]))),
    CONSTRAINT event_assignments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'declined'::text, 'completed'::text])))
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
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


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
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_event_assignments_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_assignments_deleted_at ON public.event_assignments USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_event_assignments_referee_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_assignments_referee_status ON public.event_assignments USING btree (referee_id, status);


--
-- Name: idx_events_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_deleted_at ON public.events USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_honors_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_honors_deleted_at ON public.honors USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_honors_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_honors_event ON public.honors USING btree (event_id);


--
-- Name: idx_honors_referee_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_honors_referee_status ON public.honors USING btree (referee_id, status);


--
-- Name: idx_profiles_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_deleted_at ON public.profiles USING btree (deleted_at) WHERE (deleted_at IS NULL);


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
-- Name: idx_profiles_registration_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_registration_status ON public.profiles USING btree (registration_status);


--
-- Name: event_approvals audit_event_approval; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_event_approval AFTER INSERT ON public.event_approvals FOR EACH ROW EXECUTE FUNCTION public.log_event_approval();


--
-- Name: honors audit_honor_verification; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_honor_verification AFTER UPDATE ON public.honors FOR EACH ROW EXECUTE FUNCTION public.log_honor_verification();


--
-- Name: event_assignments audit_referee_assignment_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_referee_assignment_delete AFTER DELETE ON public.event_assignments FOR EACH ROW EXECUTE FUNCTION public.log_referee_assignment();


--
-- Name: event_assignments audit_referee_assignment_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_referee_assignment_insert AFTER INSERT ON public.event_assignments FOR EACH ROW EXECUTE FUNCTION public.log_referee_assignment();


--
-- Name: event_assignments audit_referee_assignment_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_referee_assignment_update AFTER UPDATE ON public.event_assignments FOR EACH ROW EXECUTE FUNCTION public.log_referee_assignment();


--
-- Name: honors handle_honor_verification_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_honor_verification_trigger BEFORE UPDATE ON public.honors FOR EACH ROW EXECUTE FUNCTION public.handle_honor_verification();


--
-- Name: profiles on_registration_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_registration_status_change AFTER UPDATE OF registration_status ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_registration_approval();


--
-- Name: event_assignments set_event_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_event_assignments_updated_at BEFORE UPDATE ON public.event_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: events set_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: honors set_honors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_honors_updated_at BEFORE UPDATE ON public.honors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kabupaten_kota set_kabupaten_kota_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_kabupaten_kota_updated_at BEFORE UPDATE ON public.kabupaten_kota FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pengurus set_pengurus_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_pengurus_updated_at BEFORE UPDATE ON public.pengurus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: provinsi set_provinsi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_provinsi_updated_at BEFORE UPDATE ON public.provinsi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


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
-- Name: events validate_event_regional_access; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_event_regional_access BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.validate_regional_access();


--
-- Name: honors validate_honor_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_honor_trigger BEFORE INSERT OR UPDATE ON public.honors FOR EACH ROW EXECUTE FUNCTION public.validate_honor_submission();


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id);


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
-- Name: profiles profiles_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id);


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

CREATE POLICY "Admins can delete events" ON public.events FOR UPDATE USING (((deleted_at IS NULL) AND public.is_admin_provinsi(auth.uid())));


--
-- Name: event_assignments Admins can manage assignments on approved events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assignments on approved events" ON public.event_assignments USING (((deleted_at IS NULL) AND public.is_admin(auth.uid()) AND public.is_event_approved(event_id)));


--
-- Name: honors Admins can update all honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all honors" ON public.honors FOR UPDATE USING (public.is_admin(auth.uid()));


--
-- Name: events Admins can update events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (((deleted_at IS NULL) AND (public.is_admin_provinsi(auth.uid()) OR (public.has_role(auth.uid(), 'admin_kab_kota'::public.app_role) AND (kabupaten_kota_id = public.get_user_kabupaten_kota(auth.uid()))) OR (public.has_role(auth.uid(), 'panitia'::public.app_role) AND (created_by = auth.uid())))));


--
-- Name: event_assignments Admins can view all assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all assignments" ON public.event_assignments FOR SELECT USING (((deleted_at IS NULL) AND public.is_admin(auth.uid())));


--
-- Name: honors Admins can view all honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all honors" ON public.honors FOR SELECT USING (((deleted_at IS NULL) AND public.is_admin(auth.uid())));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));


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

CREATE POLICY "Everyone can view events" ON public.events FOR SELECT USING ((deleted_at IS NULL));


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

CREATE POLICY "Public can view referee profiles" ON public.profiles FOR SELECT USING ((deleted_at IS NULL));


--
-- Name: honors Referees can create their own honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can create their own honors" ON public.honors FOR INSERT WITH CHECK ((auth.uid() = referee_id));


--
-- Name: honors Referees can delete their own draft honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can delete their own draft honors" ON public.honors FOR UPDATE USING (((deleted_at IS NULL) AND (auth.uid() = referee_id) AND (status = 'draft'::text)));


--
-- Name: honors Referees can update their own draft honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can update their own draft honors" ON public.honors FOR UPDATE USING (((auth.uid() = referee_id) AND (status = 'draft'::text)));


--
-- Name: event_assignments Referees can view their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can view their own assignments" ON public.event_assignments FOR SELECT USING (((deleted_at IS NULL) AND (auth.uid() = referee_id)));


--
-- Name: honors Referees can view their own honors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Referees can view their own honors" ON public.honors FOR SELECT USING (((deleted_at IS NULL) AND (auth.uid() = referee_id)));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: profiles Users can insert their own profile during signup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile during signup" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


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
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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