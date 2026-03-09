
-- CRITICAL FIX #1: PRIVILEGE ESCALATION - Prevent users from changing their own user_type
-- Drop the existing permissive update policy and replace with column-restricted one
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can update own profile safely"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Prevent user_type modification by ensuring it hasn't changed
  AND user_type = (SELECT up.user_type FROM public.user_profiles up WHERE up.user_id = auth.uid())
);

-- CRITICAL FIX #2: Worker PII exposure - Replace contractor access to citizen_workers
-- Remove the policy that gives contractors full table access
DROP POLICY IF EXISTS "Contractors view worker basics" ON public.citizen_workers;

-- Contractors can only see non-PII fields via the get_available_workers_for_contractors() function
-- No direct table SELECT for contractors needed since they use the security definer function

-- CRITICAL FIX #3: Contractor profiles readable without auth
DROP POLICY IF EXISTS "Public contractor profiles" ON public.contractor_profiles;

CREATE POLICY "Authenticated users view verified contractor profiles"
ON public.contractor_profiles
FOR SELECT
TO authenticated
USING (verified = true);

-- CRITICAL FIX #4: Bid evaluation history visible to all authenticated users
DROP POLICY IF EXISTS "Citizens view bid evaluations" ON public.bid_evaluation_history;

CREATE POLICY "Stakeholders view relevant bid evaluations"
ON public.bid_evaluation_history
FOR SELECT
TO authenticated
USING (
  -- Government can see all
  public.get_user_type(auth.uid()) = 'government'
  -- Contractor can see their own bid evaluations
  OR EXISTS (
    SELECT 1 FROM public.contractor_bids cb
    WHERE cb.id = bid_evaluation_history.bid_id
    AND cb.contractor_id = auth.uid()
  )
  -- Reporter can see evaluations for their report
  OR EXISTS (
    SELECT 1 FROM public.problem_reports pr
    WHERE pr.id = bid_evaluation_history.report_id
    AND pr.reported_by = auth.uid()
  )
);
