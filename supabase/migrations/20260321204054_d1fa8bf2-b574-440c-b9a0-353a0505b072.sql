
-- ===========================================
-- PHASE B: Data Integrity Guards
-- ===========================================

-- 1. Verification audit log table (Phase D combined)
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL, -- 'vote', 'milestone_verify', 'bid_submit'
  user_id uuid NOT NULL,
  report_id uuid REFERENCES problem_reports(id),
  milestone_id uuid REFERENCES project_milestones(id),
  gps_latitude numeric,
  gps_longitude numeric,
  gps_accuracy numeric,
  distance_km numeric,
  result text NOT NULL, -- 'allowed', 'denied_proximity', 'denied_duplicate', 'denied_self'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Only government and the user themselves can see audit logs
CREATE POLICY "Government can read verification audit logs"
  ON public.verification_audit_log
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

-- System inserts via security definer functions
CREATE POLICY "System insert verification audit logs"
  ON public.verification_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Prevent contractor from verifying their OWN milestones
CREATE OR REPLACE FUNCTION public.prevent_self_verification()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_contractor_id uuid;
BEGIN
  -- Get the contractor assigned to this milestone's project
  SELECT p.contractor_id INTO v_contractor_id
  FROM project_milestones pm
  JOIN projects p ON p.id = pm.project_id
  WHERE pm.id = NEW.milestone_id;

  -- Block if the verifier is the contractor
  IF v_contractor_id IS NOT NULL AND NEW.verifier_id = v_contractor_id THEN
    RAISE EXCEPTION 'Contractors cannot verify their own milestones';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_self_verification
  BEFORE INSERT ON milestone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_verification();

-- 3. Prevent report author from voting on their own report (DB level)
CREATE OR REPLACE FUNCTION public.prevent_self_vote()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM problem_reports
    WHERE id = NEW.report_id AND reported_by = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'You cannot vote on your own report';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_self_vote
  BEFORE INSERT ON community_votes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_vote();

-- ===========================================
-- PHASE C: Workflow Guards
-- ===========================================

-- 4. Prevent bids on reports without allocated budget
CREATE OR REPLACE FUNCTION public.enforce_bid_prerequisites()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_report RECORD;
BEGIN
  SELECT status, budget_allocated, bidding_status
  INTO v_report
  FROM problem_reports
  WHERE id = NEW.report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;

  -- Must be in bidding_open status
  IF v_report.status != 'bidding_open' THEN
    RAISE EXCEPTION 'Bidding is not open for this report (current status: %)', v_report.status;
  END IF;

  -- Must have budget allocated
  IF v_report.budget_allocated IS NULL OR v_report.budget_allocated <= 0 THEN
    RAISE EXCEPTION 'Cannot bid: No budget has been allocated for this project';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_bid_prerequisites
  BEFORE INSERT ON contractor_bids
  FOR EACH ROW
  EXECUTE FUNCTION enforce_bid_prerequisites();

-- 5. Enforce escrow funding before project can move to in_progress
CREATE OR REPLACE FUNCTION public.enforce_escrow_before_execution()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_escrow RECORD;
  v_report_id uuid;
BEGIN
  -- Only check when transitioning TO in_progress
  IF NEW.status = 'in_progress' AND (OLD.status IS DISTINCT FROM 'in_progress') THEN
    -- Get the report_id for this project
    SELECT report_id INTO v_report_id FROM projects WHERE id = NEW.id;
    
    -- Check if escrow is fully funded
    SELECT held_amount, total_amount, released_amount
    INTO v_escrow
    FROM escrow_accounts
    WHERE project_id = NEW.id
    AND status = 'active'
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cannot start project: No escrow account found. Government must fund the escrow first.';
    END IF;

    -- Check if escrow is adequately funded (held + released >= total)
    IF (COALESCE(v_escrow.held_amount, 0) + COALESCE(v_escrow.released_amount, 0)) < v_escrow.total_amount THEN
      RAISE EXCEPTION 'Cannot start project: Escrow is not fully funded. Current: KES %, Required: KES %',
        COALESCE(v_escrow.held_amount, 0) + COALESCE(v_escrow.released_amount, 0), v_escrow.total_amount;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_escrow_before_execution
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION enforce_escrow_before_execution();
