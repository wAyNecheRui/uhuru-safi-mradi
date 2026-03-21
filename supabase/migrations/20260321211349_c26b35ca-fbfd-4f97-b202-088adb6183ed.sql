
-- Drop the recursive UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.user_profiles;

-- Recreate using security definer function to avoid recursion
CREATE POLICY "Users can update own profile safely"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND user_type = public.get_user_type(auth.uid())
  );
