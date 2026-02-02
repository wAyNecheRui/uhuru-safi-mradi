-- ============================================
-- SECURITY FIX: Allow system to insert audit logs
-- ============================================

-- Add INSERT policy for audit logs (system/trigger inserts)
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (
  -- Only authenticated users can create audit entries
  auth.uid() IS NOT NULL
  -- The performed_by must be the current user
  AND (performed_by IS NULL OR performed_by = auth.uid())
);

-- ============================================
-- SECURITY FIX: Add transparency policies for citizens
-- These allow citizens to see payment/project info for community oversight
-- ============================================

-- Citizens can view LPOs for transparency
CREATE POLICY "Citizens view LPOs for transparency"
ON local_purchase_orders FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'citizen'
  )
);

-- Citizens can view bid evaluations for transparency
CREATE POLICY "Citizens view bid evaluations"
ON bid_evaluation_history FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
  )
);

-- ============================================
-- SECURITY FIX: Improve contractor credentials visibility
-- ============================================

-- Drop the existing permissive policy for verified credentials
DROP POLICY IF EXISTS "Anyone can view verified credentials" ON contractor_credentials;

-- Only authenticated users can view verified credentials
CREATE POLICY "Authenticated view verified credentials"
ON contractor_credentials FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    verification_status = 'verified'
    OR auth.uid() = contractor_id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
    )
  )
);

-- ============================================
-- SECURITY FIX: Extend escrow visibility for project stakeholders
-- Citizens who reported issues should see related escrow info
-- ============================================

DROP POLICY IF EXISTS "Authenticated users view escrow accounts" ON escrow_accounts;

CREATE POLICY "Stakeholders view escrow accounts"
ON escrow_accounts FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Contractors see their own project escrow
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = escrow_accounts.project_id 
        AND p.contractor_id = auth.uid()
    )
    OR
    -- Government sees all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
    )
    OR
    -- Citizens who reported the problem can see escrow
    EXISTS (
      SELECT 1 FROM projects p
      JOIN problem_reports pr ON pr.id = p.report_id
      WHERE p.id = escrow_accounts.project_id
        AND pr.reported_by = auth.uid()
    )
    OR
    -- All citizens can see active funded escrow for transparency
    (
      escrow_accounts.status = 'active'
      AND escrow_accounts.total_amount > 0
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid() 
          AND user_profiles.user_type = 'citizen'
      )
    )
  )
);

-- ============================================
-- SECURITY FIX: Extend payment transaction visibility for stakeholders
-- ============================================

DROP POLICY IF EXISTS "Authenticated users view payment transactions" ON payment_transactions;

CREATE POLICY "Stakeholders view payment transactions"
ON payment_transactions FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Contractors see their own project payments
    EXISTS (
      SELECT 1 FROM escrow_accounts ea
      JOIN projects p ON p.id = ea.project_id
      WHERE ea.id = payment_transactions.escrow_account_id 
        AND p.contractor_id = auth.uid()
    )
    OR
    -- Government sees all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
    )
    OR
    -- Citizens who reported the problem can see payments
    EXISTS (
      SELECT 1 FROM escrow_accounts ea
      JOIN projects p ON p.id = ea.project_id
      JOIN problem_reports pr ON pr.id = p.report_id
      WHERE ea.id = payment_transactions.escrow_account_id
        AND pr.reported_by = auth.uid()
    )
    OR
    -- All citizens can see completed payments for transparency
    (
      payment_transactions.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid() 
          AND user_profiles.user_type = 'citizen'
      )
    )
  )
);