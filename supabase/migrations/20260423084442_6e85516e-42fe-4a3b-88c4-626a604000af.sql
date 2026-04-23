-- ============================================================
-- PHASE 8: RLS Hardening
-- ============================================================

-- 1. community_votes: Remove public read access
DROP POLICY IF EXISTS "Votes are public" ON public.community_votes;

-- 2. file_uploads: Remove public read, add stakeholder-scoped read
DROP POLICY IF EXISTS "Anyone can view file uploads" ON public.file_uploads;

CREATE POLICY "Stakeholders can view file uploads"
ON public.file_uploads
FOR SELECT
TO authenticated
USING (
  -- Uploader can always view
  auth.uid() = uploaded_by
  -- Government users can view all
  OR get_user_type(auth.uid()) = 'government'
  -- Project contractor can view project files
  OR (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = file_uploads.project_id
      AND p.contractor_id = auth.uid()
  ))
  -- Report author can view their report files
  OR (report_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.problem_reports pr
    WHERE pr.id = file_uploads.report_id
      AND pr.reported_by = auth.uid()
  ))
  -- Milestone files: visible to project contractor
  OR (milestone_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.project_milestones pm
    JOIN public.projects p ON p.id = pm.project_id
    WHERE pm.id = file_uploads.milestone_id
      AND p.contractor_id = auth.uid()
  ))
);

-- 3. blockchain_transactions: Remove broad authenticated read branch
DROP POLICY IF EXISTS "Authenticated users view blockchain transactions" ON public.blockchain_transactions;

CREATE POLICY "Stakeholders view blockchain transactions"
ON public.blockchain_transactions
FOR SELECT
TO authenticated
USING (
  get_user_type(auth.uid()) = 'government'
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = blockchain_transactions.project_id
      AND p.contractor_id = auth.uid()
  )
);

-- 4. worker_payments: Drop broad ALL policy, restrict mutations to government
DROP POLICY IF EXISTS "Contractors can manage payments for their jobs" ON public.worker_payments;
-- Drop duplicate read policies
DROP POLICY IF EXISTS "Government view worker payments" ON public.worker_payments;
DROP POLICY IF EXISTS "Workers view own payments" ON public.worker_payments;

-- Mutations restricted to government only
CREATE POLICY "Government can insert worker payments"
ON public.worker_payments
FOR INSERT
TO authenticated
WITH CHECK (get_user_type(auth.uid()) = 'government');

CREATE POLICY "Government can update worker payments"
ON public.worker_payments
FOR UPDATE
TO authenticated
USING (get_user_type(auth.uid()) = 'government')
WITH CHECK (get_user_type(auth.uid()) = 'government');

CREATE POLICY "Government can delete worker payments"
ON public.worker_payments
FOR DELETE
TO authenticated
USING (get_user_type(auth.uid()) = 'government');