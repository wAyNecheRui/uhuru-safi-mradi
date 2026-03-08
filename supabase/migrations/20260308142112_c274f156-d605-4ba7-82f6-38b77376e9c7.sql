
-- Fix all remaining policies referencing user_profiles directly

-- blockchain_transactions
DROP POLICY IF EXISTS "Government can manage blockchain records" ON public.blockchain_transactions;
CREATE POLICY "Government can manage blockchain records" ON public.blockchain_transactions
FOR ALL USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Authenticated users view blockchain transactions" ON public.blockchain_transactions;
CREATE POLICY "Authenticated users view blockchain transactions" ON public.blockchain_transactions
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    public.get_user_type(auth.uid()) = 'government'
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = blockchain_transactions.project_id AND p.contractor_id = auth.uid())
    OR (network_status = 'confirmed' AND auth.uid() IS NOT NULL)
  )
);

-- escrow_accounts
DROP POLICY IF EXISTS "Payment visibility" ON public.escrow_accounts;
DROP POLICY IF EXISTS "Stakeholders view escrow accounts" ON public.escrow_accounts;
DROP POLICY IF EXISTS "Government manages escrow" ON public.escrow_accounts;
CREATE POLICY "Stakeholders view escrow accounts" ON public.escrow_accounts
FOR SELECT USING (
  public.get_user_type(auth.uid()) = 'government'
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = escrow_accounts.project_id AND p.contractor_id = auth.uid())
);
CREATE POLICY "Government manages escrow" ON public.escrow_accounts
FOR ALL USING (public.get_user_type(auth.uid()) = 'government');

-- local_purchase_orders
DROP POLICY IF EXISTS "Government can manage LPOs" ON public.local_purchase_orders;
CREATE POLICY "Government can manage LPOs" ON public.local_purchase_orders
FOR ALL USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Citizens view LPOs for transparency" ON public.local_purchase_orders;
CREATE POLICY "Citizens view LPOs for transparency" ON public.local_purchase_orders
FOR SELECT USING (auth.uid() IS NOT NULL);

-- payment_transactions
DROP POLICY IF EXISTS "Payment transaction visibility" ON public.payment_transactions;
DROP POLICY IF EXISTS "Stakeholders view payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Government manages payments" ON public.payment_transactions;
CREATE POLICY "Stakeholders view payment transactions" ON public.payment_transactions
FOR SELECT USING (
  public.get_user_type(auth.uid()) = 'government'
  OR EXISTS (
    SELECT 1 FROM public.escrow_accounts ea
    JOIN public.projects p ON p.id = ea.project_id
    WHERE ea.id = payment_transactions.escrow_account_id AND p.contractor_id = auth.uid()
  )
);
CREATE POLICY "Government manages payments" ON public.payment_transactions
FOR ALL USING (public.get_user_type(auth.uid()) = 'government');

-- project_milestones
DROP POLICY IF EXISTS "Government can update milestones" ON public.project_milestones;
CREATE POLICY "Government can update milestones" ON public.project_milestones
FOR UPDATE USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Government can delete milestones" ON public.project_milestones;
CREATE POLICY "Government can delete milestones" ON public.project_milestones
FOR DELETE USING (public.get_user_type(auth.uid()) = 'government');

-- project_progress
DROP POLICY IF EXISTS "Progress update control" ON public.project_progress;
CREATE POLICY "Progress update control" ON public.project_progress
FOR INSERT WITH CHECK (
  auth.uid() = updated_by
  OR public.get_user_type(auth.uid()) = 'government'
);

-- projects
DROP POLICY IF EXISTS "Government manages projects" ON public.projects;
CREATE POLICY "Government manages projects" ON public.projects
FOR ALL USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Government can view all projects including deleted" ON public.projects;
CREATE POLICY "Government can view all projects including deleted" ON public.projects
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Government can delete projects" ON public.projects;
CREATE POLICY "Government can delete projects" ON public.projects
FOR DELETE USING (public.get_user_type(auth.uid()) = 'government');

-- skills_profiles
DROP POLICY IF EXISTS "Government can view contractor profiles" ON public.skills_profiles;
CREATE POLICY "Government can view contractor profiles" ON public.skills_profiles
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

-- system_analytics
DROP POLICY IF EXISTS "Government can manage analytics" ON public.system_analytics;
CREATE POLICY "Government can manage analytics" ON public.system_analytics
FOR ALL USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Government can view all analytics" ON public.system_analytics;
CREATE POLICY "Government can view all analytics" ON public.system_analytics
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

-- user_verifications
DROP POLICY IF EXISTS "Government users can view all verification records" ON public.user_verifications;
CREATE POLICY "Government users can view all verification records" ON public.user_verifications
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

DROP POLICY IF EXISTS "Government can update verification status" ON public.user_verifications;
CREATE POLICY "Government can update verification status" ON public.user_verifications
FOR UPDATE USING (public.get_user_type(auth.uid()) = 'government');

-- worker_access_audit
DROP POLICY IF EXISTS "government_can_view_own_access_logs" ON public.worker_access_audit;
CREATE POLICY "government_can_view_own_access_logs" ON public.worker_access_audit
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

-- worker_daily_records
DROP POLICY IF EXISTS "Government can view all daily records" ON public.worker_daily_records;
CREATE POLICY "Government can view all daily records" ON public.worker_daily_records
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

-- worker_data_access_logs
DROP POLICY IF EXISTS "government_can_view_own_logs" ON public.worker_data_access_logs;
CREATE POLICY "government_can_view_own_logs" ON public.worker_data_access_logs
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');

-- worker_payments
DROP POLICY IF EXISTS "Government can view all payments" ON public.worker_payments;
CREATE POLICY "Government can view all payments" ON public.worker_payments
FOR SELECT USING (public.get_user_type(auth.uid()) = 'government');
