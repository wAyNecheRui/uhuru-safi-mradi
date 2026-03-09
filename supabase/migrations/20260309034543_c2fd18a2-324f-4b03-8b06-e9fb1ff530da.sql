-- Remove role approval workflow: users get their selected role immediately on signup.

-- 1. Update handle_new_user to set user_type to the requested type directly
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
  
  -- Validate the requested type
  IF v_requested_type NOT IN ('citizen', 'contractor', 'government') THEN
    v_requested_type := 'citizen';
  END IF;
  
  -- Set user_type to what the user requested
  INSERT INTO public.user_profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_requested_type
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- 2. Update assign_default_role to assign the requested role directly
CREATE OR REPLACE FUNCTION public.assign_default_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Assign the role matching the user's user_type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, NEW.user_type::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 3. Fix existing users: grant them the role matching their user_type
INSERT INTO public.user_roles (user_id, role)
SELECT up.user_id, up.user_type::app_role
FROM public.user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = up.user_id AND ur.role::text = up.user_type
)
ON CONFLICT (user_id, role) DO NOTHING;