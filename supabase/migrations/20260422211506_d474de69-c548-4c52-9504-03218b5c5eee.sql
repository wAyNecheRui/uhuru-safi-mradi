
-- ============================================================
-- A1: Soft KRA PIN format validation via trigger
-- (CHECK constraint not used because some legacy values are encrypted)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_kra_pin_format()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only validate non-null, non-encrypted values
  -- Encrypted values are base64 (>15 chars) or start with [DEMO]
  IF NEW.kra_pin IS NOT NULL 
     AND NEW.kra_pin NOT LIKE '[DEMO]%'
     AND length(NEW.kra_pin) = 11
     AND NEW.kra_pin !~ '^[PA][0-9]{9}[A-Z]$' THEN
    RAISE EXCEPTION 'Invalid KRA PIN format. Expected: [P|A] + 9 digits + uppercase letter (e.g., A012345678X)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_kra_pin ON public.contractor_profiles;
CREATE TRIGGER trg_validate_kra_pin
  BEFORE INSERT OR UPDATE OF kra_pin ON public.contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_kra_pin_format();

-- ============================================================
-- B4.1: Consent records (DPA lawful-basis log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL,
  privacy_notice_version text NOT NULL,
  lawful_basis text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  ip_address inet,
  user_agent text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own consent records"
  ON public.consent_records FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Users insert own consent records"
  ON public.consent_records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users withdraw own consent"
  ON public.consent_records FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_consent_records_user ON public.consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON public.consent_records(consent_type);

-- ============================================================
-- B1.2: Information requests (ATIA 21-day SLA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.information_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid,
  requester_name text,
  requester_email text,
  requester_phone text,
  subject text NOT NULL CHECK (length(subject) BETWEEN 3 AND 300),
  description text NOT NULL CHECK (length(description) BETWEEN 10 AND 5000),
  related_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  related_report_id uuid REFERENCES public.problem_reports(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','acknowledged','in_progress','responded','closed','rejected')),
  statutory_deadline timestamptz NOT NULL DEFAULT (now() + interval '21 days'),
  responded_at timestamptz,
  response text,
  responded_by uuid,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_info_requests_status ON public.information_requests(status);
CREATE INDEX IF NOT EXISTS idx_info_requests_deadline ON public.information_requests(statutory_deadline);
CREATE INDEX IF NOT EXISTS idx_info_requests_requester ON public.information_requests(requester_id);

ALTER TABLE public.information_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit info requests"
  ON public.information_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(subject) BETWEEN 3 AND 300 
    AND length(description) BETWEEN 10 AND 5000
    AND status = 'submitted'
  );

CREATE POLICY "Requester or oversight views info requests"
  ON public.information_requests FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid() 
    OR public.has_role(auth.uid(), 'government'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'auditor'::app_role)
  );

CREATE POLICY "Government processes info requests"
  ON public.information_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'government'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'government'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_info_requests_updated_at
  BEFORE UPDATE ON public.information_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- B3.4: Conflict of Interest declarations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conflict_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  official_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  report_id uuid REFERENCES public.problem_reports(id) ON DELETE CASCADE,
  has_conflict boolean NOT NULL,
  relationship_description text,
  declared_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (official_id, contractor_id, report_id)
);

ALTER TABLE public.conflict_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officials manage own COI declarations"
  ON public.conflict_declarations FOR ALL TO authenticated
  USING (official_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'auditor'::app_role))
  WITH CHECK (official_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_coi_official ON public.conflict_declarations(official_id);
CREATE INDEX IF NOT EXISTS idx_coi_contractor ON public.conflict_declarations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_coi_report ON public.conflict_declarations(report_id);

-- Patch evaluate_bid() with COI gate
CREATE OR REPLACE FUNCTION public.evaluate_bid(p_bid_id uuid, p_evaluator_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(bid_id uuid, price_score numeric, technical_score numeric, experience_score numeric, agpo_bonus numeric, total_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_bid RECORD;
  v_report RECORD;
  v_contractor RECORD;
  v_min_bid numeric;
  v_price_score numeric;
  v_technical_score numeric;
  v_experience_score numeric;
  v_agpo_bonus numeric := 0;
  v_total_score numeric;
  v_actual_project_count integer;
  v_completed_project_count integer;
  v_coi_status RECORD;
BEGIN
  IF p_bid_id IS NULL THEN RAISE EXCEPTION 'Bid ID is required'; END IF;
  IF p_evaluator_id IS NULL THEN RAISE EXCEPTION 'Evaluator ID is required'; END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 5000 THEN
    RAISE EXCEPTION 'Evaluation notes exceed maximum length of 5000 characters';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND user_type = 'government'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only government officials can evaluate bids';
  END IF;

  IF p_evaluator_id != auth.uid() THEN
    RAISE EXCEPTION 'Evaluator ID must match authenticated user';
  END IF;

  SELECT * INTO v_bid FROM contractor_bids WHERE id = p_bid_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bid not found'; END IF;

  IF v_bid.evaluated_at IS NOT NULL THEN
    RAISE EXCEPTION 'Bid has already been evaluated';
  END IF;

  -- COI gate
  SELECT * INTO v_coi_status
  FROM conflict_declarations
  WHERE official_id = p_evaluator_id
    AND contractor_id = v_bid.contractor_id
    AND report_id = v_bid.report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conflict of interest declaration required before evaluating this bid';
  END IF;

  IF v_coi_status.has_conflict = true THEN
    RAISE EXCEPTION 'You have declared a conflict of interest with this contractor and cannot evaluate their bid';
  END IF;

  SELECT * INTO v_report FROM problem_reports WHERE id = v_bid.report_id;
  SELECT * INTO v_contractor FROM contractor_profiles WHERE user_id = v_bid.contractor_id;

  SELECT 
    COUNT(*)::integer,
    COUNT(CASE WHEN status IN ('completed', 'closed') THEN 1 END)::integer
  INTO v_actual_project_count, v_completed_project_count
  FROM projects 
  WHERE contractor_id = v_bid.contractor_id AND deleted_at IS NULL;

  SELECT MIN(bid_amount) INTO v_min_bid
  FROM contractor_bids WHERE report_id = v_bid.report_id;

  IF v_bid.bid_amount > 0 AND v_min_bid > 0 THEN
    v_price_score := (v_min_bid / v_bid.bid_amount) * 40;
  ELSE
    v_price_score := 20;
  END IF;

  v_technical_score := 15;
  IF v_bid.technical_approach IS NOT NULL AND LENGTH(v_bid.technical_approach) > 100 THEN
    v_technical_score := v_technical_score + 10;
  END IF;
  IF LENGTH(v_bid.proposal) > 200 THEN
    v_technical_score := v_technical_score + 5;
  END IF;
  v_technical_score := LEAST(v_technical_score, 30);

  IF v_contractor IS NOT NULL THEN
    v_experience_score := 0;
    v_experience_score := v_experience_score + LEAST(COALESCE(v_contractor.years_in_business, 0), 10);
    v_experience_score := v_experience_score + LEAST(v_actual_project_count, 10);
    v_experience_score := v_experience_score + (COALESCE(v_contractor.average_rating, 0) * 2);
  ELSE
    v_experience_score := 15;
  END IF;
  v_experience_score := LEAST(v_experience_score, 30);

  IF v_contractor IS NOT NULL AND v_contractor.is_agpo = true AND v_contractor.agpo_verified = true THEN
    v_agpo_bonus := 5;
  END IF;

  v_total_score := v_price_score + v_technical_score + v_experience_score + v_agpo_bonus;

  UPDATE contractor_bids
  SET price_score = v_price_score,
      technical_score = v_technical_score,
      experience_score = v_experience_score,
      agpo_bonus = v_agpo_bonus,
      total_score = v_total_score,
      evaluation_notes = p_notes,
      evaluated_at = now(),
      evaluated_by = p_evaluator_id
  WHERE id = p_bid_id;

  INSERT INTO bid_evaluation_history (
    bid_id, report_id, evaluated_by,
    price_score, technical_score, experience_score,
    agpo_bonus, total_score, evaluation_notes
  ) VALUES (
    p_bid_id, v_bid.report_id, p_evaluator_id,
    v_price_score, v_technical_score, v_experience_score,
    v_agpo_bonus, v_total_score, p_notes
  );

  RETURN QUERY SELECT 
    p_bid_id, v_price_score, v_technical_score, v_experience_score, v_agpo_bonus, v_total_score;
END;
$function$;

-- ============================================================
-- E1: Audit log immutability
-- ============================================================
DROP POLICY IF EXISTS "Audit logs are append-only" ON public.audit_logs;
CREATE POLICY "Audit logs are append-only"
  ON public.audit_logs FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON public.audit_logs;
CREATE POLICY "Audit logs cannot be deleted"
  ON public.audit_logs FOR DELETE TO authenticated USING (false);

ALTER TABLE public.bid_evaluation_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bid history append-only" ON public.bid_evaluation_history;
CREATE POLICY "Bid history append-only"
  ON public.bid_evaluation_history FOR UPDATE TO authenticated USING (false);
DROP POLICY IF EXISTS "Bid history no delete" ON public.bid_evaluation_history;
CREATE POLICY "Bid history no delete"
  ON public.bid_evaluation_history FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "Approval audit append-only" ON public.project_approval_audit;
CREATE POLICY "Approval audit append-only"
  ON public.project_approval_audit FOR UPDATE TO authenticated USING (false);
DROP POLICY IF EXISTS "Approval audit no delete" ON public.project_approval_audit;
CREATE POLICY "Approval audit no delete"
  ON public.project_approval_audit FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "Verification audit append-only" ON public.verification_audit_log;
CREATE POLICY "Verification audit append-only"
  ON public.verification_audit_log FOR UPDATE TO authenticated USING (false);
DROP POLICY IF EXISTS "Verification audit no delete" ON public.verification_audit_log;
CREATE POLICY "Verification audit no delete"
  ON public.verification_audit_log FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "Worker access audit append-only" ON public.worker_access_audit;
CREATE POLICY "Worker access audit append-only"
  ON public.worker_access_audit FOR UPDATE TO authenticated USING (false);
DROP POLICY IF EXISTS "Worker access audit no delete" ON public.worker_access_audit;
CREATE POLICY "Worker access audit no delete"
  ON public.worker_access_audit FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "Worker data logs append-only" ON public.worker_data_access_logs;
CREATE POLICY "Worker data logs append-only"
  ON public.worker_data_access_logs FOR UPDATE TO authenticated USING (false);
DROP POLICY IF EXISTS "Worker data logs no delete" ON public.worker_data_access_logs;
CREATE POLICY "Worker data logs no delete"
  ON public.worker_data_access_logs FOR DELETE TO authenticated USING (false);
