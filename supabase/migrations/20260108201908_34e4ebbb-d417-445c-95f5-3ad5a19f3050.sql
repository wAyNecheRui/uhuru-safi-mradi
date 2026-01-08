-- ============================================
-- RLS POLICY ALIGNMENT MIGRATION
-- Aligns all policies with Government Project Transparency & Accountability System
-- Uses user_profiles.user_type for role checks
-- ============================================

-- 1️⃣ PROBLEM REPORTS (problem_reports table)
-- Drop existing policies and recreate aligned ones

DROP POLICY IF EXISTS "Users can create problem reports" ON problem_reports;
DROP POLICY IF EXISTS "Users can view all problem reports" ON problem_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON problem_reports;
DROP POLICY IF EXISTS "Users can delete own pending reports" ON problem_reports;

-- INSERT – Citizens only
CREATE POLICY "Citizens can report problems"
ON problem_reports
FOR INSERT
WITH CHECK (
  auth.uid() = reported_by
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'citizen'
  )
);

-- SELECT – Public transparency
CREATE POLICY "Anyone can view reported problems"
ON problem_reports
FOR SELECT
USING (true);

-- UPDATE – Reporter only (before approval) OR Government
CREATE POLICY "Reporter can update own problem or government"
ON problem_reports
FOR UPDATE
USING (
  (auth.uid() = reported_by AND status = 'pending')
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- DELETE – Reporter (pending only) OR Government
CREATE POLICY "Delete by reporter or government"
ON problem_reports
FOR DELETE
USING (
  (auth.uid() = reported_by AND status = 'pending')
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- 2️⃣ COMMUNITY VOTES (community_votes table)
DROP POLICY IF EXISTS "Anyone can view votes" ON community_votes;
DROP POLICY IF EXISTS "Users can vote on reports" ON community_votes;
DROP POLICY IF EXISTS "Users can update their votes" ON community_votes;

-- INSERT – Citizens only
CREATE POLICY "Citizens can vote"
ON community_votes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'citizen'
  )
);

-- SELECT – Public
CREATE POLICY "Votes are public"
ON community_votes
FOR SELECT
USING (true);

-- UPDATE – Own vote only
CREATE POLICY "Users can update own vote"
ON community_votes
FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE – Own vote only
CREATE POLICY "Users can remove own vote"
ON community_votes
FOR DELETE
USING (auth.uid() = user_id);

-- 3️⃣ CONTRACTOR PROFILES (contractor_profiles table)
DROP POLICY IF EXISTS "Contractors can manage own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Government can view all contractor profiles" ON contractor_profiles;
DROP POLICY IF EXISTS "Government can view all contractor profiles directly" ON contractor_profiles;
DROP POLICY IF EXISTS "Public can view verified contractors" ON contractor_profiles;

-- INSERT – Contractors only
CREATE POLICY "Contractors can register"
ON contractor_profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'contractor'
  )
);

-- UPDATE – Contractor (own) OR Government
CREATE POLICY "Update by owner or government"
ON contractor_profiles
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- SELECT – Public transparency for verified, full access for government
CREATE POLICY "Public contractor profiles"
ON contractor_profiles
FOR SELECT
USING (
  verified = true
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- DELETE – Own only (for cleanup)
CREATE POLICY "Contractors can delete own profile"
ON contractor_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- 4️⃣ PROJECTS (projects table)
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Government users can create projects" ON projects;

-- SELECT – Everyone (public transparency)
CREATE POLICY "Projects are publicly visible"
ON projects
FOR SELECT
USING (true);

-- INSERT – Government only
CREATE POLICY "Government creates projects"
ON projects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- UPDATE – Government only
CREATE POLICY "Government manages projects"
ON projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- DELETE – Government only
CREATE POLICY "Government can delete projects"
ON projects
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- 5️⃣ CONTRACTOR BIDS (contractor_bids table)
DROP POLICY IF EXISTS "Bidding contractor and government can view bids" ON contractor_bids;
DROP POLICY IF EXISTS "Contractors can submit bids" ON contractor_bids;
DROP POLICY IF EXISTS "Contractors can update their bids" ON contractor_bids;

-- INSERT – Verified contractors only
CREATE POLICY "Verified contractors bid"
ON contractor_bids
FOR INSERT
WITH CHECK (
  auth.uid() = contractor_id
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'contractor'
  )
  AND EXISTS (
    SELECT 1 FROM contractor_profiles
    WHERE contractor_profiles.user_id = auth.uid()
    AND verified = true
  )
);

-- SELECT – Contractor sees own, Government sees all
CREATE POLICY "Bid visibility control"
ON contractor_bids
FOR SELECT
USING (
  auth.uid() = contractor_id
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- UPDATE – Contractor (own pending bids) OR Government
CREATE POLICY "Bid update control"
ON contractor_bids
FOR UPDATE
USING (
  (auth.uid() = contractor_id AND status = 'submitted')
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- 6️⃣ PROJECT PROGRESS (project_progress table)
DROP POLICY IF EXISTS "Anyone can view project progress" ON project_progress;
DROP POLICY IF EXISTS "Project stakeholders can update progress" ON project_progress;

-- INSERT – Assigned contractor only
CREATE POLICY "Contractor reports progress"
ON project_progress
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_progress.project_id
    AND p.contractor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- SELECT – Public transparency
CREATE POLICY "Progress is public"
ON project_progress
FOR SELECT
USING (true);

-- UPDATE – Contractor (own) OR Government
CREATE POLICY "Progress update control"
ON project_progress
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_progress.project_id
    AND p.contractor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- 7️⃣ ESCROW & PAYMENTS
-- escrow_accounts
DROP POLICY IF EXISTS "Government can manage escrow" ON escrow_accounts;
DROP POLICY IF EXISTS "Project stakeholders can view escrow accounts" ON escrow_accounts;

-- SELECT – Contractor (own project) OR Government
CREATE POLICY "Payment visibility"
ON escrow_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = escrow_accounts.project_id
    AND p.contractor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- INSERT/UPDATE/DELETE – Government only
CREATE POLICY "Government manages escrow"
ON escrow_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- payment_transactions
DROP POLICY IF EXISTS "Government can manage payments" ON payment_transactions;
DROP POLICY IF EXISTS "government_can_view_all_payments" ON payment_transactions;
DROP POLICY IF EXISTS "project_stakeholders_can_view_payments" ON payment_transactions;

-- SELECT – Contractor (own) OR Government
CREATE POLICY "Payment transaction visibility"
ON payment_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM escrow_accounts ea
    JOIN projects p ON p.id = ea.project_id
    WHERE ea.id = payment_transactions.escrow_account_id
    AND p.contractor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- ALL – Government only (no client INSERT for security)
CREATE POLICY "Government manages payments"
ON payment_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- 8️⃣ CITIZEN WORKERS (citizen_workers table)
DROP POLICY IF EXISTS "verified_government_can_read_workers" ON citizen_workers;
DROP POLICY IF EXISTS "verified_government_can_update_verification_status" ON citizen_workers;
DROP POLICY IF EXISTS "verified_government_read_workers" ON citizen_workers;
DROP POLICY IF EXISTS "workers_can_manage_own_profile" ON citizen_workers;
DROP POLICY IF EXISTS "workers_own_profile_access" ON citizen_workers;

-- INSERT – Citizen (self)
CREATE POLICY "Citizens register skills"
ON citizen_workers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'citizen'
  )
);

-- SELECT – Own profile OR Contractors & Government can discover
CREATE POLICY "Workers are discoverable"
ON citizen_workers
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type IN ('contractor', 'government')
  )
);

-- UPDATE – Own profile OR Government (for verification status)
CREATE POLICY "Worker profile updates"
ON citizen_workers
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- DELETE – Own profile only
CREATE POLICY "Workers can delete own profile"
ON citizen_workers
FOR DELETE
USING (auth.uid() = user_id);

-- 9️⃣ AUDIT LOGS - Create table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT – Government only
CREATE POLICY "Audit logs restricted"
ON audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- No INSERT/UPDATE/DELETE from client (backend only via service role)