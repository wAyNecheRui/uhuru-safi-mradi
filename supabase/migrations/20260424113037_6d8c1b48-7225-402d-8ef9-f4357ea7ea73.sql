-- Replace the strict county-lock trigger with a permissive cross-county model.
-- New behaviour:
--   * Citizens may report in ANY county (where they currently are, by GPS).
--   * The report's county comes from the client (GPS -> nearest centroid).
--   * If the client did not provide a county, fall back to reporter's home county
--     ONLY when GPS-derived county is impossible to compute (defence in depth).
--   * Soft anti-fraud cap: a citizen can submit at most 3 reports per rolling
--     24h window where report.county differs from their registered home county.
--   * Every cross-county submission is audited for transparency.

CREATE OR REPLACE FUNCTION public.set_and_enforce_report_county()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type           text;
  v_reporter_county     text;
  v_cross_county_count  integer;
  v_is_cross_county     boolean := false;
BEGIN
  IF NEW.reported_by IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_type, county
    INTO v_user_type, v_reporter_county
  FROM public.user_profiles
  WHERE user_id = NEW.reported_by;

  -- INSERT path: validate + audit
  IF TG_OP = 'INSERT' THEN
    -- Citizens must have a registered home county (still required for voting weight)
    IF v_user_type = 'citizen'
       AND (v_reporter_county IS NULL OR btrim(v_reporter_county) = '') THEN
      RAISE EXCEPTION 'You must set your registered (home) county before reporting issues.'
        USING ERRCODE = 'check_violation';
    END IF;

    -- County is required on the report itself (client must derive from GPS)
    IF NEW.county IS NULL OR btrim(NEW.county) = '' THEN
      -- Last-resort fallback: use reporter's home county so we never store NULL
      NEW.county := v_reporter_county;
    END IF;

    IF NEW.county IS NULL OR btrim(NEW.county) = '' THEN
      RAISE EXCEPTION 'Report county could not be determined. GPS location is required.'
        USING ERRCODE = 'check_violation';
    END IF;

    -- Detect cross-county submission
    IF v_user_type = 'citizen'
       AND v_reporter_county IS NOT NULL
       AND lower(btrim(NEW.county)) <> lower(btrim(v_reporter_county)) THEN
      v_is_cross_county := true;

      -- Soft anti-fraud cap: max 3 cross-county reports per rolling 24h
      SELECT COUNT(*)
        INTO v_cross_county_count
      FROM public.problem_reports pr
      JOIN public.user_profiles up ON up.user_id = pr.reported_by
      WHERE pr.reported_by = NEW.reported_by
        AND pr.created_at >= now() - interval '24 hours'
        AND pr.deleted_at IS NULL
        AND up.county IS NOT NULL
        AND lower(btrim(pr.county)) <> lower(btrim(up.county));

      IF v_cross_county_count >= 3 THEN
        INSERT INTO public.verification_audit_log (
          user_id, report_id, action_type, result, metadata
        ) VALUES (
          NEW.reported_by, NEW.id, 'report_submission', 'denied_cross_county_cap',
          jsonb_build_object(
            'home_county', v_reporter_county,
            'attempted_county', NEW.county,
            'cross_county_24h_count', v_cross_county_count
          )
        );
        RAISE EXCEPTION 'Daily limit reached: you can submit at most 3 reports outside your home county (%) per 24 hours. Please try again later.',
          v_reporter_county
          USING ERRCODE = 'check_violation';
      END IF;

      -- Audit allowed cross-county submission
      INSERT INTO public.verification_audit_log (
        user_id, report_id, action_type, result, metadata
      ) VALUES (
        NEW.reported_by, NEW.id, 'report_submission', 'allowed_cross_county',
        jsonb_build_object(
          'home_county', v_reporter_county,
          'report_county', NEW.county,
          'cross_county_24h_count', v_cross_county_count + 1
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;