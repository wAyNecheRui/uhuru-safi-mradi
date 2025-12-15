-- Update handle_new_user trigger to capture more registration data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, user_type, phone_number, location, county)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'citizen'),
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'location'
  );
  RETURN NEW;
END;
$function$;