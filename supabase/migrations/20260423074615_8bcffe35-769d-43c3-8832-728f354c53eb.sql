
-- ============================================================
-- CRITICAL SECURITY FIX: Remove permissive policies that
-- override restrictive ones (PERMISSIVE policies are OR-combined)
-- ============================================================

-- 1. payment_transactions: drop blanket transparency policy
DROP POLICY IF EXISTS "Citizens view payments for transparency" ON public.payment_transactions;

-- Replace with stakeholder-scoped read access
DROP POLICY IF EXISTS "Stakeholders view payment transactions" ON public.payment_transactions;
CREATE POLICY "Stakeholders view payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM escrow_accounts ea
    JOIN projects p ON p.id = ea.project_id
    WHERE ea.id = payment_transactions.escrow_account_id
      AND (
        p.contractor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM problem_reports pr
          WHERE pr.id = p.report_id AND pr.reported_by = auth.uid()
        )
        OR public.is_verified_government_user(auth.uid())
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

-- 2. escrow_accounts: drop blanket transparency policy
DROP POLICY IF EXISTS "Citizens view escrow for transparency" ON public.escrow_accounts;

DROP POLICY IF EXISTS "Stakeholders view escrow accounts" ON public.escrow_accounts;
CREATE POLICY "Stakeholders view escrow accounts"
ON public.escrow_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = escrow_accounts.project_id
      AND (
        p.contractor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM problem_reports pr
          WHERE pr.id = p.report_id AND pr.reported_by = auth.uid()
        )
        OR public.is_verified_government_user(auth.uid())
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

-- 3. local_purchase_orders: drop blanket transparency policy
DROP POLICY IF EXISTS "Citizens view LPOs for transparency" ON public.local_purchase_orders;

DROP POLICY IF EXISTS "Stakeholders view local purchase orders" ON public.local_purchase_orders;
CREATE POLICY "Stakeholders view local purchase orders"
ON public.local_purchase_orders
FOR SELECT
TO authenticated
USING (
  contractor_id = auth.uid()
  OR public.is_verified_government_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM projects p
    JOIN problem_reports pr ON pr.id = p.report_id
    WHERE p.id = local_purchase_orders.project_id
      AND pr.reported_by = auth.uid()
  )
);

-- 4. STORAGE: contractor-documents — remove blanket auth policy
DROP POLICY IF EXISTS "Authenticated users view contractor documents" ON storage.objects;

-- 5. STORAGE: citizen-documents — remove blanket auth policy
DROP POLICY IF EXISTS "Authenticated view citizen documents" ON storage.objects;

-- 6. citizen_workers: restrict job-creator policy to non-sensitive view
-- The full row exposes national_id, kra_pin, bank_account etc.
-- Drop the broad policy; contractors must use get_available_workers() or 
-- get_worker_contact_info() (only after hiring) which already exist as SECURITY DEFINER functions
-- exposing only safe fields.
DROP POLICY IF EXISTS "Job creators view applicant worker profiles" ON public.citizen_workers;

-- Replace with a strictly scoped policy: only contractors who have ACCEPTED an application
-- from the worker can see the worker row, and even then they should rely on the 
-- decryption RPC functions for sensitive fields. Sensitive fields are encrypted at rest.
CREATE POLICY "Contractors view hired worker profiles"
ON public.citizen_workers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workforce_applications wa
    JOIN workforce_jobs wj ON wj.id = wa.job_id
    WHERE wa.worker_id = citizen_workers.id
      AND wj.created_by = auth.uid()
      AND wa.status = 'accepted'
  )
);

-- 7. community_votes: require authentication for reads
DROP POLICY IF EXISTS "Community votes are publicly readable" ON public.community_votes;
DROP POLICY IF EXISTS "Anyone can view community votes" ON public.community_votes;
DROP POLICY IF EXISTS "Public can view community votes" ON public.community_votes;

DROP POLICY IF EXISTS "Authenticated users view community votes" ON public.community_votes;
CREATE POLICY "Authenticated users view community votes"
ON public.community_votes
FOR SELECT
TO authenticated
USING (true);
