-- =============================================================
-- PRE-PHASE A: County Lock + Contractor Bidding Freedom
-- =============================================================

-- 0. Drop dependent view (will be recreated without registered_counties)
DROP VIEW IF EXISTS public.contractor_profiles_public;

-- 1. Drop deprecated contractor multi-county column
ALTER TABLE public.contractor_profiles
  DROP COLUMN IF EXISTS registered_counties;

-- 1b. Recreate the public view without registered_counties
CREATE VIEW public.contractor_profiles_public AS
SELECT
  id,
  user_id,
  company_name,
  agpo_category,
  agpo_verified,
  average_rating,
  created_at,
  is_agpo,
  max_project_capacity,
  number_of_employees,
  previous_projects_count,
  specialization,
  total_contract_value,
  updated_at,
  verification_date,
  verified,
  years_in_business
FROM public.contractor_profiles;

-- 2. Replace can_contractor_bid: contractors can bid nationwide
CREATE OR REPLACE FUNCTION public.can_contractor_bid(p_contractor_id uuid, p_report_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Contractors are allowed to bid on any project nationwide.
  -- Location is informational only (HQ / base of operations).
  -- Eligibility is governed by status, prerequisites, and conflict-of-interest checks.
  RETURN true;
END;
$function$;

-- 3. County lock + government auto-sync trigger
CREATE OR REPLACE FUNCTION public.enforce_county_lock_and_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.county IS DISTINCT FROM OLD.county THEN
    SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;

    IF NEW.user_type IN ('citizen', 'government') AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Your registered county is permanent and cannot be changed. Please contact an administrator if you need to update it.';
    END IF;

    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data, new_data, performed_by
    ) VALUES (
      'user_profiles',
      NEW.id,
      'county_change',
      jsonb_build_object('county', OLD.county, 'user_type', OLD.user_type),
      jsonb_build_object('county', NEW.county, 'user_type', NEW.user_type, 'admin_override', v_is_admin),
      auth.uid()
    );

    IF NEW.user_type = 'government' AND NEW.county IS NOT NULL THEN
      UPDATE public.government_profiles
      SET assigned_counties = ARRAY[NEW.county],
          updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_county_lock_and_sync ON public.user_profiles;
CREATE TRIGGER trg_enforce_county_lock_and_sync
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_county_lock_and_sync();

-- 4. Seed government assigned_counties on profile insert/county set
CREATE OR REPLACE FUNCTION public.seed_government_assigned_counties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_type = 'government' AND NEW.county IS NOT NULL THEN
    UPDATE public.government_profiles
    SET assigned_counties = ARRAY[NEW.county],
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND (assigned_counties IS NULL OR array_length(assigned_counties, 1) IS NULL);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_seed_government_assigned_counties ON public.user_profiles;
CREATE TRIGGER trg_seed_government_assigned_counties
AFTER INSERT OR UPDATE OF county ON public.user_profiles
FOR EACH ROW
WHEN (NEW.user_type = 'government')
EXECUTE FUNCTION public.seed_government_assigned_counties();