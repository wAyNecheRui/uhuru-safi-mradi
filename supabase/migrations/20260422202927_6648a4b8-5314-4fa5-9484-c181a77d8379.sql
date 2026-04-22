-- 1. BID MANIPULATION DEFENSE
CREATE OR REPLACE FUNCTION public.prevent_bid_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.evaluated_at IS NOT NULL AND auth.uid() = OLD.contractor_id THEN
    IF NEW.bid_amount IS DISTINCT FROM OLD.bid_amount
       OR NEW.proposal IS DISTINCT FROM OLD.proposal
       OR NEW.estimated_duration IS DISTINCT FROM OLD.estimated_duration
       OR NEW.technical_approach IS DISTINCT FROM OLD.technical_approach
       OR NEW.materials_spec IS DISTINCT FROM OLD.materials_spec
    THEN
      RAISE EXCEPTION 'Cannot modify a bid that has already been evaluated';
    END IF;
  END IF;

  IF OLD.status IN ('selected', 'rejected') AND auth.uid() = OLD.contractor_id THEN
    RAISE EXCEPTION 'Cannot modify a bid after it has been %', OLD.status;
  END IF;

  IF auth.uid() = OLD.contractor_id
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('selected', 'evaluated')
  THEN
    RAISE EXCEPTION 'Contractors cannot change their own bid status';
  END IF;

  IF auth.uid() = OLD.contractor_id THEN
    IF NEW.price_score IS DISTINCT FROM OLD.price_score
       OR NEW.technical_score IS DISTINCT FROM OLD.technical_score
       OR NEW.experience_score IS DISTINCT FROM OLD.experience_score
       OR NEW.total_score IS DISTINCT FROM OLD.total_score
       OR NEW.agpo_bonus IS DISTINCT FROM OLD.agpo_bonus
       OR NEW.evaluated_at IS DISTINCT FROM OLD.evaluated_at
       OR NEW.evaluated_by IS DISTINCT FROM OLD.evaluated_by
    THEN
      RAISE EXCEPTION 'Contractors cannot modify evaluation scores';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_bid_tampering ON public.contractor_bids;
CREATE TRIGGER trg_prevent_bid_tampering
  BEFORE UPDATE ON public.contractor_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_bid_tampering();

-- 2. ESCROW OVER-RELEASE PROTECTION
CREATE OR REPLACE FUNCTION public.prevent_escrow_over_release()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.released_amount > NEW.total_amount THEN
    RAISE EXCEPTION 'Cannot release more than total escrow. Released: %, Total: %',
      NEW.released_amount, NEW.total_amount;
  END IF;

  IF (COALESCE(NEW.held_amount, 0) + COALESCE(NEW.released_amount, 0)) > NEW.total_amount + 0.01 THEN
    RAISE EXCEPTION 'Escrow accounting violation: held (%) + released (%) > total (%)',
      NEW.held_amount, NEW.released_amount, NEW.total_amount;
  END IF;

  IF NEW.worker_wage_released > NEW.worker_wage_allocation THEN
    RAISE EXCEPTION 'Worker wage over-release blocked. Released: %, Allocation: %',
      NEW.worker_wage_released, NEW.worker_wage_allocation;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.released_amount < OLD.released_amount THEN
    RAISE EXCEPTION 'Released amount cannot decrease (audit-trail integrity)';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.worker_wage_released < OLD.worker_wage_released THEN
    RAISE EXCEPTION 'Worker wage released cannot decrease (audit-trail integrity)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_escrow_over_release ON public.escrow_accounts;
CREATE TRIGGER trg_prevent_escrow_over_release
  BEFORE INSERT OR UPDATE ON public.escrow_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_escrow_over_release();

-- 3. PAYMENT DOUBLE-SPEND GUARD
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_milestone_completed
  ON public.payment_transactions (milestone_id, transaction_type)
  WHERE status = 'completed' AND deleted_at IS NULL AND milestone_id IS NOT NULL;

-- 4. LOCK REPORT MUTATIONS AFTER APPROVAL
CREATE OR REPLACE FUNCTION public.prevent_report_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
BEGIN
  v_user_type := public.get_user_type(auth.uid());

  IF auth.uid() = OLD.reported_by AND v_user_type = 'citizen' THEN
    IF OLD.status <> 'pending' THEN
      RAISE EXCEPTION 'Cannot edit report after it has moved past pending (current: %)', OLD.status;
    END IF;
    IF NEW.reported_by IS DISTINCT FROM OLD.reported_by
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
       OR NEW.budget_allocated IS DISTINCT FROM OLD.budget_allocated
       OR NEW.status IS DISTINCT FROM OLD.status
    THEN
      RAISE EXCEPTION 'Citizens cannot modify status, approval, or budget fields';
    END IF;
  END IF;

  IF OLD.status IN ('in_progress', 'under_verification', 'completed') THEN
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.coordinates IS DISTINCT FROM OLD.coordinates
       OR NEW.location IS DISTINCT FROM OLD.location
       OR NEW.reported_by IS DISTINCT FROM OLD.reported_by
    THEN
      RAISE EXCEPTION 'Report core fields are immutable once status is %', OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_report_tampering ON public.problem_reports;
CREATE TRIGGER trg_prevent_report_tampering
  BEFORE UPDATE ON public.problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_report_tampering();

-- 5. INPUT VALIDATION ON PROBLEM REPORTS
ALTER TABLE public.problem_reports
  DROP CONSTRAINT IF EXISTS problem_reports_text_length_check;

ALTER TABLE public.problem_reports
  ADD CONSTRAINT problem_reports_text_length_check CHECK (
    length(title) BETWEEN 5 AND 300
    AND length(description) BETWEEN 10 AND 5000
    AND (location IS NULL OR length(location) <= 500)
    AND (constituency IS NULL OR length(constituency) <= 200)
    AND (ward IS NULL OR length(ward) <= 200)
    AND (direct_procurement_justification IS NULL OR length(direct_procurement_justification) <= 5000)
  );

-- 6. FILE UPLOAD VALIDATION
ALTER TABLE public.file_uploads
  DROP CONSTRAINT IF EXISTS file_uploads_size_type_check;

ALTER TABLE public.file_uploads
  ADD CONSTRAINT file_uploads_size_type_check CHECK (
    file_size > 0
    AND file_size <= 26214400
    AND length(file_name) BETWEEN 1 AND 500
    AND length(file_path) BETWEEN 1 AND 1000
    AND file_type ~* '^(image/(jpeg|jpg|png|webp|gif|heic|heif)|video/(mp4|webm|quicktime|3gpp)|application/pdf)$'
  );

-- 7. AUTO-DISPUTE ON CONFLICTING VERIFICATIONS
CREATE OR REPLACE FUNCTION public.auto_dispute_on_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approved INTEGER;
  v_rejected INTEGER;
  v_project_id UUID;
  v_milestone_title TEXT;
  v_existing_dispute INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE verification_status = 'approved'),
    COUNT(*) FILTER (WHERE verification_status = 'rejected')
  INTO v_approved, v_rejected
  FROM public.milestone_verifications
  WHERE milestone_id = NEW.milestone_id;

  IF v_approved >= 2 AND v_rejected >= 2 THEN
    SELECT pm.project_id, pm.title INTO v_project_id, v_milestone_title
    FROM public.project_milestones pm
    WHERE pm.id = NEW.milestone_id;

    SELECT COUNT(*) INTO v_existing_dispute
    FROM public.disputes
    WHERE milestone_id = NEW.milestone_id
      AND dispute_type = 'verification_conflict'
      AND status = 'open';

    IF v_existing_dispute = 0 AND v_project_id IS NOT NULL THEN
      INSERT INTO public.disputes (
        project_id, milestone_id, raised_by, dispute_type,
        title, description, status, priority
      ) VALUES (
        v_project_id,
        NEW.milestone_id,
        NEW.verifier_id,
        'verification_conflict',
        'Conflicting citizen verifications: ' || COALESCE(v_milestone_title, 'milestone'),
        format('Citizens disagree on milestone completion. Approvals: %s, Rejections: %s. Government inspector review required before payment release.',
               v_approved, v_rejected),
        'open',
        'high'
      );

      UPDATE public.project_milestones
      SET status = 'submitted',
          verified_at = NULL,
          verified_by = NULL
      WHERE id = NEW.milestone_id
        AND status IN ('verified', 'payment_processing');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_dispute_on_conflict ON public.milestone_verifications;
CREATE TRIGGER trg_auto_dispute_on_conflict
  AFTER INSERT ON public.milestone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_dispute_on_conflict();

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_milestone_verifications_milestone_status
  ON public.milestone_verifications (milestone_id, verification_status);

CREATE INDEX IF NOT EXISTS idx_disputes_milestone_status
  ON public.disputes (milestone_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_milestone_status
  ON public.payment_transactions (milestone_id, status)
  WHERE deleted_at IS NULL;