-- ============================================================
-- LOCATION ARCHITECTURE — PHASE 1
-- ============================================================

-- 1. Add county column to problem_reports
ALTER TABLE public.problem_reports
  ADD COLUMN IF NOT EXISTS county text;

CREATE INDEX IF NOT EXISTS idx_problem_reports_county ON public.problem_reports(county);

-- 2. Add vote_weight to community_votes
ALTER TABLE public.community_votes
  ADD COLUMN IF NOT EXISTS vote_weight numeric NOT NULL DEFAULT 1.0;

-- ============================================================
-- 3. AUTO-DERIVE & ENFORCE REPORT COUNTY (citizens are county-locked)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_and_enforce_report_county()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_reporter_county text;
BEGIN
  -- Skip on hard delete / nothing to set
  IF NEW.reported_by IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_type, county
    INTO v_user_type, v_reporter_county
  FROM public.user_profiles
  WHERE user_id = NEW.reported_by;

  -- Auto-populate county from reporter's locked county on INSERT
  IF TG_OP = 'INSERT' THEN
    -- If client did not set county, inherit from reporter
    IF NEW.county IS NULL OR btrim(NEW.county) = '' THEN
      NEW.county := v_reporter_county;
    END IF;

    -- Hard block: citizens cannot report outside their registered county
    IF v_user_type = 'citizen' THEN
      IF v_reporter_county IS NULL OR btrim(v_reporter_county) = '' THEN
        RAISE EXCEPTION 'You must set your county before reporting issues.'
          USING ERRCODE = 'check_violation';
      END IF;

      -- If county was explicitly provided and differs, reject
      IF NEW.county IS NOT NULL
         AND btrim(NEW.county) <> ''
         AND lower(btrim(NEW.county)) <> lower(btrim(v_reporter_county)) THEN
        -- Audit denial
        INSERT INTO public.verification_audit_log (
          user_id, report_id, action_type, result, metadata
        ) VALUES (
          NEW.reported_by, NEW.id, 'report_submission', 'denied_out_of_county',
          jsonb_build_object(
            'reporter_county', v_reporter_county,
            'attempted_county', NEW.county
          )
        );
        RAISE EXCEPTION 'You can only report issues inside your registered county (%). Attempted: %',
          v_reporter_county, NEW.county
          USING ERRCODE = 'check_violation';
      END IF;

      -- Force county to reporter's locked county (defence in depth)
      NEW.county := v_reporter_county;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_and_enforce_report_county ON public.problem_reports;
CREATE TRIGGER trg_set_and_enforce_report_county
  BEFORE INSERT ON public.problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_and_enforce_report_county();

-- Backfill existing reports' county from reporter
UPDATE public.problem_reports pr
SET county = up.county
FROM public.user_profiles up
WHERE pr.reported_by = up.user_id
  AND pr.county IS NULL
  AND up.county IS NOT NULL
  AND btrim(up.county) <> '';

-- ============================================================
-- 4. WEIGHTED VOTING (cross-county votes count at 0.3×)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_vote_weight()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voter_county text;
  v_report_county text;
BEGIN
  SELECT county INTO v_voter_county
  FROM public.user_profiles WHERE user_id = NEW.user_id;

  SELECT county INTO v_report_county
  FROM public.problem_reports WHERE id = NEW.report_id;

  IF v_voter_county IS NULL OR v_report_county IS NULL THEN
    NEW.vote_weight := 1.0;
  ELSIF lower(btrim(v_voter_county)) = lower(btrim(v_report_county)) THEN
    NEW.vote_weight := 1.0;
  ELSE
    NEW.vote_weight := 0.3;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_vote_weight ON public.community_votes;
CREATE TRIGGER trg_set_vote_weight
  BEFORE INSERT ON public.community_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vote_weight();

-- Update vote-threshold trigger to use weighted sum
CREATE OR REPLACE FUNCTION public.check_vote_threshold_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weighted_total NUMERIC;
  report_status TEXT;
BEGIN
  SELECT COALESCE(SUM(cv.vote_weight), 0) INTO weighted_total
  FROM community_votes cv
  WHERE cv.report_id = NEW.report_id;

  SELECT status INTO report_status
  FROM problem_reports
  WHERE id = NEW.report_id;

  IF weighted_total >= 3 AND report_status = 'pending' THEN
    UPDATE problem_reports
    SET status = 'under_review',
        verified_votes = floor(weighted_total)::int,
        updated_at = now()
    WHERE id = NEW.report_id
      AND status = 'pending';
  ELSE
    UPDATE problem_reports
    SET verified_votes = floor(weighted_total)::int,
        updated_at = now()
    WHERE id = NEW.report_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill existing vote weights
UPDATE public.community_votes cv
SET vote_weight = CASE
  WHEN up.county IS NULL OR pr.county IS NULL THEN 1.0
  WHEN lower(btrim(up.county)) = lower(btrim(pr.county)) THEN 1.0
  ELSE 0.3
END
FROM public.user_profiles up, public.problem_reports pr
WHERE cv.user_id = up.user_id AND cv.report_id = pr.id;

-- ============================================================
-- 5. TIGHTEN MILESTONE VERIFICATION TO 3 KM
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_verify_milestone(
  user_lat numeric, user_lon numeric, p_milestone_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_coords text;
  rlat numeric; rlon numeric; dist numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  SELECT pr.coordinates INTO report_coords
  FROM project_milestones pm
  JOIN projects p ON p.id = pm.project_id
  JOIN problem_reports pr ON pr.id = p.report_id
  WHERE pm.id = p_milestone_id;

  IF report_coords IS NULL OR report_coords = '' THEN RETURN true; END IF;

  BEGIN
    rlat := split_part(report_coords, ',', 1)::numeric;
    rlon := split_part(report_coords, ',', 2)::numeric;
  EXCEPTION WHEN OTHERS THEN
    RETURN true;
  END;

  dist := haversine_distance_km(user_lat, user_lon, rlat, rlon);
  RETURN dist <= 3;  -- TIGHTENED FROM 10 KM
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_verify(
  user_lat numeric, user_lon numeric, report_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_coords text; rlat numeric; rlon numeric; dist numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  SELECT pr.coordinates INTO report_coords
  FROM problem_reports pr WHERE pr.id = can_user_verify.report_id;

  IF report_coords IS NULL OR report_coords = '' THEN RETURN true; END IF;

  BEGIN
    rlat := split_part(report_coords, ',', 1)::numeric;
    rlon := split_part(report_coords, ',', 2)::numeric;
  EXCEPTION WHEN OTHERS THEN
    RETURN true;
  END;

  dist := haversine_distance_km(user_lat, user_lon, rlat, rlon);
  RETURN dist <= 3;  -- TIGHTENED FROM 10 KM
END;
$$;

-- ============================================================
-- 6. GOVERNMENT COUNTY SCOPE — HARD BLOCK
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_gov_county_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_assigned text[];
  v_target_county text;
BEGIN
  -- Skip if no authenticated user (e.g., system inserts via SECURITY DEFINER)
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  -- Admins and superadmins bypass
  IF has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;

  SELECT user_type INTO v_user_type
  FROM public.user_profiles WHERE user_id = auth.uid();

  -- Only enforce on government users
  IF v_user_type IS DISTINCT FROM 'government' THEN RETURN NEW; END IF;

  v_target_county := COALESCE(NEW.county, OLD.county);
  IF v_target_county IS NULL OR btrim(v_target_county) = '' THEN
    RETURN NEW; -- nothing to enforce against
  END IF;

  SELECT assigned_counties INTO v_assigned
  FROM public.government_profiles WHERE user_id = auth.uid();

  IF v_assigned IS NULL OR array_length(v_assigned, 1) IS NULL THEN
    INSERT INTO public.verification_audit_log (
      user_id, report_id, action_type, result, metadata
    ) VALUES (
      auth.uid(), NEW.id, TG_OP || '_report', 'denied_no_assigned_counties',
      jsonb_build_object('target_county', v_target_county)
    );
    RAISE EXCEPTION 'Action denied: no counties assigned to your account. Contact administrator.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT (lower(btrim(v_target_county)) = ANY (
    SELECT lower(btrim(c)) FROM unnest(v_assigned) c
  )) THEN
    INSERT INTO public.verification_audit_log (
      user_id, report_id, action_type, result, metadata
    ) VALUES (
      auth.uid(), NEW.id, TG_OP || '_report', 'denied_out_of_jurisdiction',
      jsonb_build_object(
        'target_county', v_target_county,
        'assigned_counties', to_jsonb(v_assigned)
      )
    );
    RAISE EXCEPTION 'Action denied: report county (%) is outside your assigned counties.',
      v_target_county
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_gov_county_scope_update ON public.problem_reports;
CREATE TRIGGER trg_enforce_gov_county_scope_update
  BEFORE UPDATE ON public.problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_gov_county_scope();

-- DELETE block
CREATE OR REPLACE FUNCTION public.enforce_gov_county_scope_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_assigned text[];
BEGIN
  IF auth.uid() IS NULL THEN RETURN OLD; END IF;
  IF has_role(auth.uid(), 'admin'::app_role) THEN RETURN OLD; END IF;

  SELECT user_type INTO v_user_type
  FROM public.user_profiles WHERE user_id = auth.uid();

  IF v_user_type IS DISTINCT FROM 'government' THEN RETURN OLD; END IF;
  IF OLD.county IS NULL OR btrim(OLD.county) = '' THEN RETURN OLD; END IF;

  SELECT assigned_counties INTO v_assigned
  FROM public.government_profiles WHERE user_id = auth.uid();

  IF v_assigned IS NULL OR NOT (lower(btrim(OLD.county)) = ANY (
    SELECT lower(btrim(c)) FROM unnest(v_assigned) c
  )) THEN
    RAISE EXCEPTION 'Delete denied: report county (%) is outside your assigned counties.', OLD.county
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_gov_county_scope_delete ON public.problem_reports;
CREATE TRIGGER trg_enforce_gov_county_scope_delete
  BEFORE DELETE ON public.problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_gov_county_scope_delete();