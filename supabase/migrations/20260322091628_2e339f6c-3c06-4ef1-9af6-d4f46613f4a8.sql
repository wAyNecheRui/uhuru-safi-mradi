
-- FIX 1: CRITICAL - Prevent privilege escalation on user_profiles INSERT
-- Current policy allows setting any user_type. Restrict to 'citizen' only.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND user_type = 'citizen'
);

-- FIX 2: CRITICAL - Hide KRA PIN from non-owners in contractor_profiles
DROP POLICY IF EXISTS "Authenticated users view verified contractor profiles" ON public.contractor_profiles;

CREATE POLICY "Contractors view own full profile"
ON public.contractor_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Government users view all contractor profiles"
ON public.contractor_profiles
FOR SELECT
TO authenticated
USING (
  get_user_type(auth.uid()) = 'government'
);

-- FIX 3: Deny all direct client access to rate_limits
DROP POLICY IF EXISTS "deny_all_rate_limits" ON public.rate_limits;
CREATE POLICY "deny_all_rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- FIX 4: Deny all direct client access to callback_nonces
DROP POLICY IF EXISTS "deny_all_callback_nonces" ON public.callback_nonces;
CREATE POLICY "deny_all_callback_nonces"
ON public.callback_nonces
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);
