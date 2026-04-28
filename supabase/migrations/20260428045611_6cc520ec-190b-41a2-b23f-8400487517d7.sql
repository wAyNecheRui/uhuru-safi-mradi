-- Fix county lock trigger to allow initial set from NULL
-- Previously, NULL IS DISTINCT FROM 'X' returned true and blocked the first save,
-- preventing citizens/government from confirming their county and trapping them in the gate.
CREATE OR REPLACE FUNCTION public.enforce_county_lock_and_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean := false;
  v_old_set boolean;
BEGIN
  v_old_set := OLD.county IS NOT NULL AND btrim(OLD.county) <> '';

  -- Only enforce the lock when there was already a saved county and it's being changed
  IF TG_OP = 'UPDATE' AND v_old_set AND NEW.county IS DISTINCT FROM OLD.county THEN
    SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;

    IF NEW.user_type IN ('citizen', 'government') AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Your county is locked to your account once saved.';
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
  END IF;

  -- Always sync government assigned_counties when county is set/changed
  IF NEW.user_type = 'government' AND NEW.county IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.county IS DISTINCT FROM OLD.county) THEN
    UPDATE public.government_profiles
    SET assigned_counties = ARRAY[NEW.county],
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$function$;