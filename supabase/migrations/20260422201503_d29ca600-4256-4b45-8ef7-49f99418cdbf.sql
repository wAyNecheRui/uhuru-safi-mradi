
-- ============================================================
-- AUDIT REMEDIATION: P0 (FK indexes) + P1 (worker PII masking)
-- ============================================================

-- 1) Add btree indexes on all 44 unindexed foreign key columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_bid_evaluation_history_bid_id ON public.bid_evaluation_history(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_evaluation_history_report_id ON public.bid_evaluation_history(report_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_payment_transaction_id ON public.blockchain_transactions(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_user_id ON public.community_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_bids_contractor_id ON public.contractor_bids(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_bids_deleted_by ON public.contractor_bids(deleted_by);
CREATE INDEX IF NOT EXISTS idx_contractor_credentials_contractor_id ON public.contractor_credentials(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_credentials_verified_by ON public.contractor_credentials(verified_by);
CREATE INDEX IF NOT EXISTS idx_contractor_ratings_project_id ON public.contractor_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_disputes_milestone_id ON public.disputes(milestone_id);
CREATE INDEX IF NOT EXISTS idx_disputes_project_id ON public.disputes(project_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_deleted_by ON public.escrow_accounts(deleted_by);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_project_id ON public.escrow_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_milestone_id ON public.file_uploads(milestone_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_project_id ON public.file_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_report_id ON public.file_uploads(report_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON public.file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_local_purchase_orders_project_id ON public.local_purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_verifications_verifier_id ON public.milestone_verifications(verifier_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_deleted_by ON public.payment_transactions(deleted_by);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_escrow_account_id ON public.payment_transactions(escrow_account_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_approved_by ON public.problem_reports(approved_by);
CREATE INDEX IF NOT EXISTS idx_problem_reports_deleted_by ON public.problem_reports(deleted_by);
CREATE INDEX IF NOT EXISTS idx_project_approval_audit_project_id ON public.project_approval_audit(project_id);
CREATE INDEX IF NOT EXISTS idx_project_approval_audit_report_id ON public.project_approval_audit(report_id);
CREATE INDEX IF NOT EXISTS idx_project_approval_audit_winning_bid_id ON public.project_approval_audit(winning_bid_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_verified_by ON public.project_milestones(verified_by);
CREATE INDEX IF NOT EXISTS idx_project_progress_milestone_id ON public.project_progress(milestone_id);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_by ON public.projects(deleted_by);
CREATE INDEX IF NOT EXISTS idx_projects_report_id ON public.projects(report_id);
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_milestone_id ON public.quality_checkpoints(milestone_id);
CREATE INDEX IF NOT EXISTS idx_realtime_project_updates_project_id ON public.realtime_project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_verifications_verified_by ON public.user_verifications(verified_by);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_milestone_id ON public.verification_audit_log(milestone_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_report_id ON public.verification_audit_log(report_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_reviewed_by ON public.verification_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_escrow_account_id ON public.worker_payments(escrow_account_id);
CREATE INDEX IF NOT EXISTS idx_worker_payments_job_id ON public.worker_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_workforce_applications_worker_id ON public.workforce_applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_workforce_jobs_project_id ON public.workforce_jobs(project_id);

-- Composite index for common hot-path RLS lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- 2) Mask worker phone PII: drop the broad citizen SELECT on worker_payments
--    Citizens lose direct row access, but transparency is still served via 
--    aggregated data on escrow_accounts / payment_transactions.
DROP POLICY IF EXISTS "Citizens view worker payments for transparency" ON public.worker_payments;

-- 3) Audit log: prevent the privilege-escalation vector by ensuring user_id 
--    cannot be modified on user_profiles update.
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.user_profiles;
CREATE POLICY "Users can update own profile safely"
  ON public.user_profiles
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK (
    (select auth.uid()) = user_id
    AND user_type = public.get_user_type((select auth.uid()))
  );
