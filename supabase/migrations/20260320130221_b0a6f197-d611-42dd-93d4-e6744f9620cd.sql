
-- Fix: Replace all direct user_profiles queries in RLS policies with
-- get_user_type() SECURITY DEFINER function to prevent infinite recursion.

-- 1. job_applications INSERT (the immediate bug)
DROP POLICY IF EXISTS "Citizens can apply for jobs" ON public.job_applications;
CREATE POLICY "Citizens can apply for jobs" ON public.job_applications
  FOR INSERT TO public
  WITH CHECK (auth.uid() = applicant_id AND get_user_type(auth.uid()) = 'citizen');

-- 2. citizen_workers INSERT
DROP POLICY IF EXISTS "Citizens register skills" ON public.citizen_workers;
CREATE POLICY "Citizens register skills" ON public.citizen_workers
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND get_user_type(auth.uid()) = 'citizen');

-- 3. community_votes INSERT
DROP POLICY IF EXISTS "Citizens can vote" ON public.community_votes;
CREATE POLICY "Citizens can vote" ON public.community_votes
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND get_user_type(auth.uid()) = 'citizen');

-- 4. contractor_bids INSERT
DROP POLICY IF EXISTS "Contractors can submit bids" ON public.contractor_bids;
CREATE POLICY "Contractors can submit bids" ON public.contractor_bids
  FOR INSERT TO public
  WITH CHECK (auth.uid() = contractor_id AND get_user_type(auth.uid()) = 'contractor');

-- 5. contractor_profiles INSERT
DROP POLICY IF EXISTS "Contractors can register" ON public.contractor_profiles;
CREATE POLICY "Contractors can register" ON public.contractor_profiles
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND get_user_type(auth.uid()) = 'contractor');

-- 6. contractor_ratings INSERT
DROP POLICY IF EXISTS "Project stakeholders can rate contractors" ON public.contractor_ratings;
CREATE POLICY "Project stakeholders can rate contractors" ON public.contractor_ratings
  FOR INSERT TO public
  WITH CHECK (
    (EXISTS (SELECT 1 FROM projects p WHERE p.id = contractor_ratings.project_id
      AND (p.contractor_id = auth.uid() OR EXISTS (SELECT 1 FROM problem_reports pr WHERE pr.id = p.report_id AND pr.reported_by = auth.uid()))))
    OR get_user_type(auth.uid()) = 'government'
  );

-- 7. disputes INSERT
DROP POLICY IF EXISTS "Project stakeholders can raise disputes" ON public.disputes;
CREATE POLICY "Project stakeholders can raise disputes" ON public.disputes
  FOR INSERT TO public
  WITH CHECK (
    auth.uid() = raised_by AND (
      EXISTS (SELECT 1 FROM projects p WHERE p.id = disputes.project_id
        AND (p.contractor_id = auth.uid() OR EXISTS (SELECT 1 FROM problem_reports pr WHERE pr.id = p.report_id AND pr.reported_by = auth.uid())))
      OR get_user_type(auth.uid()) = 'government'
    )
  );

-- 8. milestone_verifications INSERT
DROP POLICY IF EXISTS "Citizens can verify milestones" ON public.milestone_verifications;
CREATE POLICY "Citizens can verify milestones" ON public.milestone_verifications
  FOR INSERT TO public
  WITH CHECK (auth.uid() = verifier_id AND get_user_type(auth.uid()) = 'citizen');

-- 9. problem_reports INSERT
DROP POLICY IF EXISTS "Citizens can report problems" ON public.problem_reports;
CREATE POLICY "Citizens can report problems" ON public.problem_reports
  FOR INSERT TO public
  WITH CHECK (auth.uid() = reported_by AND get_user_type(auth.uid()) = 'citizen');

-- 10. project_approval_audit INSERT
DROP POLICY IF EXISTS "Government can create approval audit records" ON public.project_approval_audit;
CREATE POLICY "Government can create approval audit records" ON public.project_approval_audit
  FOR INSERT TO public
  WITH CHECK (get_user_type(auth.uid()) = 'government');

-- 11. project_milestones INSERT
DROP POLICY IF EXISTS "Government can create milestones" ON public.project_milestones;
CREATE POLICY "Government can create milestones" ON public.project_milestones
  FOR INSERT TO public
  WITH CHECK (get_user_type(auth.uid()) = 'government');

-- 12. project_progress INSERT
DROP POLICY IF EXISTS "Contractor reports progress" ON public.project_progress;
CREATE POLICY "Contractor reports progress" ON public.project_progress
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_progress.project_id AND p.contractor_id = auth.uid())
    OR get_user_type(auth.uid()) = 'government'
  );

-- 13. projects INSERT
DROP POLICY IF EXISTS "Government creates projects" ON public.projects;
CREATE POLICY "Government creates projects" ON public.projects
  FOR INSERT TO public
  WITH CHECK (get_user_type(auth.uid()) = 'government');

-- 14. workforce_jobs INSERT
DROP POLICY IF EXISTS "Contractors can create jobs for their projects" ON public.workforce_jobs;
CREATE POLICY "Contractors can create jobs for their projects" ON public.workforce_jobs
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = workforce_jobs.project_id AND p.contractor_id = auth.uid())
    AND get_user_type(auth.uid()) = 'contractor'
  );
