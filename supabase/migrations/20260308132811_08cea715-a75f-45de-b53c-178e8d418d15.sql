
-- Fix: Allow user_profiles.user_type to reflect requested role (for dashboard routing)
-- while user_roles table still enforces citizen-only until admin approval.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_requested_type TEXT;
BEGIN
  v_requested_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'citizen');
  
  -- Store the requested user_type in profile for UI/dashboard routing.
  -- Actual permissions are enforced via user_roles table (always starts as citizen).
  INSERT INTO public.user_profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_requested_type
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- If user requested a non-citizen role, create a verification request for admin approval
  IF v_requested_type IN ('contractor', 'government') THEN
    INSERT INTO public.verification_requests (user_id, requested_role, justification, status)
    VALUES (
      NEW.id,
      v_requested_type,
      'Auto-created from registration as ' || v_requested_type,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix existing users whose user_type was wrongly overwritten to citizen
UPDATE public.user_profiles up
SET user_type = COALESCE(
  (SELECT raw_user_meta_data->>'user_type' FROM auth.users au WHERE au.id = up.user_id),
  'citizen'
)
WHERE up.user_type = 'citizen'
AND EXISTS (
  SELECT 1 FROM auth.users au 
  WHERE au.id = up.user_id 
  AND au.raw_user_meta_data->>'user_type' IN ('contractor', 'government')
);
