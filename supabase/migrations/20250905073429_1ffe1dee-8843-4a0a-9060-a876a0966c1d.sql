-- Step 1: Create the secure government verification function
CREATE OR REPLACE FUNCTION public.is_verified_government_user(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = COALESCE(user_uuid, auth.uid())
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = COALESCE(user_uuid, auth.uid())
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  );
$$;

-- Test the function exists
SELECT public.is_verified_government_user() AS test_function_exists;