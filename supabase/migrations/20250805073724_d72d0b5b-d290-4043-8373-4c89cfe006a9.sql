-- Create profiles for existing users
INSERT INTO public.user_profiles (user_id, full_name, user_type)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  COALESCE(raw_user_meta_data->>'user_type', 'citizen')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles);