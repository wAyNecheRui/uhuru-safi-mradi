-- Comprehensive security fix for government user verification
-- Creating all components in single transaction

-- 1. Create the secure government verification function
CREATE OR REPLACE FUNCTION public.is_verified_government_user(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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

-- 2. Drop existing policies to rebuild them securely
DROP POLICY IF EXISTS "government_read_all_workers" ON public.citizen_workers;
DROP POLICY IF EXISTS "verified_government_read_workers" ON public.citizen_workers;

-- 3. Create audit table first (before policies that might reference it)
CREATE TABLE IF NOT EXISTS public.worker_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  government_user_id uuid NOT NULL,
  worker_id uuid NOT NULL, 
  access_type text NOT NULL,
  accessed_fields text[],
  access_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  session_id text,
  ip_address inet
);

-- 4. Enable RLS on audit table
ALTER TABLE public.worker_data_access_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create the new secure policy for citizen_workers
CREATE POLICY "verified_government_read_workers" 
ON public.citizen_workers 
FOR SELECT
TO authenticated
USING (
  -- Direct check instead of function call to avoid dependency issues
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
);

-- 6. Create audit table policies
CREATE POLICY "verified_government_can_log_access" 
ON public.worker_data_access_logs 
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
  AND auth.uid() = government_user_id
);

CREATE POLICY "government_can_view_own_logs" 
ON public.worker_data_access_logs 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
  AND auth.uid() = government_user_id
);

-- 7. Add trigger for audit table updates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_worker_data_access_logs_updated_at'
  ) THEN
    CREATE TRIGGER update_worker_data_access_logs_updated_at
      BEFORE UPDATE ON public.worker_data_access_logs
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;