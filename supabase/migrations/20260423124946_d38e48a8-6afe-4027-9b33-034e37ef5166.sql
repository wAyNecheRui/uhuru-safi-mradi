-- Drop the legacy overload that only checks government_profiles.verified.
-- Keep only the strict version that requires an approved user_verifications entry.
DROP FUNCTION IF EXISTS public.is_verified_government_user();

-- Ensure the canonical function exists with the strict definition.
CREATE OR REPLACE FUNCTION public.is_verified_government_user(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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