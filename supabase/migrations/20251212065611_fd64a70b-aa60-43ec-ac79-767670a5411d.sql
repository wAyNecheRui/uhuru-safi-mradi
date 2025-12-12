-- Fix the assign_default_role trigger - it should use user_type from the inserted profile, not raw_user_meta_data
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Assign role based on user_type from the user_profiles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, NEW.user_type::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;