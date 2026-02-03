-- Fix infinite recursion in RLS policies on public.user_profiles
-- Root cause: policy "Government view all user profiles" queried user_profiles inside its own USING clause.

DO $$
BEGIN
  -- Drop problematic/duplicate policies (safe even if some don't exist)
  EXECUTE 'DROP POLICY IF EXISTS "Government view all user profiles" ON public.user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users view own profile only" ON public.user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles';
END $$;

-- Ensure RLS is enabled (should already be true)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users: can read their own profile
CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users: can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users: can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Government/Admin: can read profiles (non-recursive, relies on user_roles)
CREATE POLICY "Privileged roles can read profiles"
ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('government', 'admin')
  )
);
