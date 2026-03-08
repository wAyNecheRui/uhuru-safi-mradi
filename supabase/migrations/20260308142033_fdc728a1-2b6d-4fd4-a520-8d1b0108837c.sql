
-- Fix ALL remaining policies that directly reference user_profiles to use get_user_type() instead
-- This prevents any future infinite recursion chains

-- audit_logs
DROP POLICY IF EXISTS "Audit logs restricted" ON public.audit_logs;
CREATE POLICY "Audit logs restricted" ON public.audit_logs
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

-- bid_evaluation_history  
DROP POLICY IF EXISTS "Government can manage bid evaluations" ON public.bid_evaluation_history;
CREATE POLICY "Government can manage bid evaluations" ON public.bid_evaluation_history
FOR ALL USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Citizens view bid evaluations" ON public.bid_evaluation_history;
CREATE POLICY "Citizens view bid evaluations" ON public.bid_evaluation_history
FOR SELECT USING (auth.uid() IS NOT NULL);

-- citizen_workers
DROP POLICY IF EXISTS "Government view all workers" ON public.citizen_workers;
CREATE POLICY "Government view all workers" ON public.citizen_workers
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Contractors view worker basics" ON public.citizen_workers;
CREATE POLICY "Contractors view worker basics" ON public.citizen_workers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contractor_profiles cp
    WHERE cp.user_id = auth.uid() AND cp.verified = true
  )
  AND public.get_user_type(auth.uid()) = 'contractor'
);

DROP POLICY IF EXISTS "Worker profile updates" ON public.citizen_workers;
CREATE POLICY "Worker profile updates" ON public.citizen_workers
FOR UPDATE USING (
  auth.uid() = user_id OR public.get_user_type(auth.uid()) = 'government'
);

-- contractor_bids
DROP POLICY IF EXISTS "Bid update control" ON public.contractor_bids;
CREATE POLICY "Bid update control" ON public.contractor_bids
FOR UPDATE USING (
  ((auth.uid() = contractor_id) AND (status = 'submitted'))
  OR public.get_user_type(auth.uid()) = 'government'
);

DROP POLICY IF EXISTS "Bid visibility for active bids" ON public.contractor_bids;
CREATE POLICY "Bid visibility for active bids" ON public.contractor_bids
FOR SELECT USING (
  deleted_at IS NULL AND (
    auth.uid() = contractor_id
    OR public.get_user_type(auth.uid()) = 'government'
  )
);

-- contractor_credentials
DROP POLICY IF EXISTS "Authenticated view verified credentials" ON public.contractor_credentials;
CREATE POLICY "Authenticated view verified credentials" ON public.contractor_credentials
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    verification_status = 'verified'
    OR auth.uid() = contractor_id
    OR public.get_user_type(auth.uid()) = 'government'
  )
);

DROP POLICY IF EXISTS "Government can verify credentials" ON public.contractor_credentials;
CREATE POLICY "Government can verify credentials" ON public.contractor_credentials
FOR UPDATE USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Government can view all contractor credentials" ON public.contractor_credentials;
CREATE POLICY "Government can view all contractor credentials" ON public.contractor_credentials
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

-- contractor_profiles
DROP POLICY IF EXISTS "Update by owner or government" ON public.contractor_profiles;
CREATE POLICY "Update by owner or government" ON public.contractor_profiles
FOR UPDATE USING (
  auth.uid() = user_id OR public.get_user_type(auth.uid()) = 'government'
);

DROP POLICY IF EXISTS "Public contractor profiles" ON public.contractor_profiles;
CREATE POLICY "Public contractor profiles" ON public.contractor_profiles
FOR SELECT USING (
  auth.uid() = user_id OR verified = true OR public.get_user_type(auth.uid()) = 'government'
);

-- disputes
DROP POLICY IF EXISTS "Active disputes visible to stakeholders" ON public.disputes;
CREATE POLICY "Active disputes visible to stakeholders" ON public.disputes
FOR SELECT USING (
  status = 'resolved'
  OR auth.uid() = raised_by
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = disputes.project_id AND p.contractor_id = auth.uid())
  OR public.get_user_type(auth.uid()) = 'government'
);

DROP POLICY IF EXISTS "Government can update disputes" ON public.disputes;
CREATE POLICY "Government can update disputes" ON public.disputes
FOR UPDATE USING (public.get_user_type(auth.uid()) = 'government');
