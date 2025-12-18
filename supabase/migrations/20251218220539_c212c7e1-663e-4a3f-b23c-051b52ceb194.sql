-- =====================================================
-- KENYA PUBLIC PROCUREMENT ACT COMPLIANT BIDDING SYSTEM
-- =====================================================

-- Add bidding workflow columns to problem_reports table
ALTER TABLE public.problem_reports
ADD COLUMN IF NOT EXISTS bidding_status text DEFAULT 'not_open',
ADD COLUMN IF NOT EXISTS bidding_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS bidding_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS bidding_extensions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_bids_required integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS is_high_value boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_emergency boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_agpo_reserved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS direct_procurement_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS direct_procurement_justification text;

-- Add evaluation and AGPO columns to contractor_bids table  
ALTER TABLE public.contractor_bids
ADD COLUMN IF NOT EXISTS price_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS technical_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS agpo_bonus numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS evaluation_notes text,
ADD COLUMN IF NOT EXISTS evaluated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS evaluated_by uuid;

-- Add AGPO fields to contractor_profiles
ALTER TABLE public.contractor_profiles
ADD COLUMN IF NOT EXISTS agpo_category text, -- 'women', 'youth', 'pwd', or null
ADD COLUMN IF NOT EXISTS agpo_certificate_url text,
ADD COLUMN IF NOT EXISTS agpo_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agpo_verified_at timestamp with time zone;

-- Create bid_evaluation_history table for audit trail
CREATE TABLE IF NOT EXISTS public.bid_evaluation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id uuid NOT NULL REFERENCES public.contractor_bids(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.problem_reports(id) ON DELETE CASCADE,
  evaluated_by uuid NOT NULL,
  price_score numeric NOT NULL DEFAULT 0,
  technical_score numeric NOT NULL DEFAULT 0,
  experience_score numeric NOT NULL DEFAULT 0,
  agpo_bonus numeric DEFAULT 0,
  total_score numeric NOT NULL DEFAULT 0,
  evaluation_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on bid_evaluation_history
ALTER TABLE public.bid_evaluation_history ENABLE ROW LEVEL SECURITY;

-- Government can manage evaluations
CREATE POLICY "Government can manage bid evaluations"
ON public.bid_evaluation_history
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = auth.uid()
  AND user_profiles.user_type = 'government'
));

-- Contractors can view their own evaluations
CREATE POLICY "Contractors can view their bid evaluations"
ON public.bid_evaluation_history
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM contractor_bids cb
  WHERE cb.id = bid_evaluation_history.bid_id
  AND cb.contractor_id = auth.uid()
));

-- Create project_approval_audit table for multi-signature approval
CREATE TABLE IF NOT EXISTS public.project_approval_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.problem_reports(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  winning_bid_id uuid REFERENCES public.contractor_bids(id) ON DELETE SET NULL,
  approved_by uuid NOT NULL,
  approval_action text NOT NULL, -- 'approve', 'reject', 'request_exception', 'extend_bidding'
  justification text,
  blockchain_hash text,
  bid_count integer,
  agpo_compliant boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on project_approval_audit
ALTER TABLE public.project_approval_audit ENABLE ROW LEVEL SECURITY;

-- Anyone can view audit records (transparency)
CREATE POLICY "Anyone can view approval audit records"
ON public.project_approval_audit
FOR SELECT
USING (true);

-- Only government can insert audit records
CREATE POLICY "Government can create approval audit records"
ON public.project_approval_audit
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = auth.uid()
  AND user_profiles.user_type = 'government'
));

-- Create function to check if project meets minimum bid requirements
CREATE OR REPLACE FUNCTION public.check_bid_requirements(p_report_id uuid)
RETURNS TABLE (
  meets_requirements boolean,
  bid_count integer,
  min_required integer,
  agpo_bids integer,
  agpo_required integer,
  can_approve boolean,
  extension_count integer,
  days_remaining integer,
  status_message text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report RECORD;
  v_bid_count integer;
  v_agpo_bids integer;
  v_min_required integer;
  v_agpo_required integer;
  v_estimated_cost numeric;
  v_days_remaining integer;
BEGIN
  -- Get report details
  SELECT pr.*, 
         COALESCE(pr.estimated_cost, 0) as cost,
         COALESCE(pr.bidding_extensions, 0) as extensions,
         pr.bidding_end_date
  INTO v_report
  FROM problem_reports pr
  WHERE pr.id = p_report_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 3, 0, 1, false, 0, 0, 'Report not found'::text;
    RETURN;
  END IF;
  
  -- Count total bids
  SELECT COUNT(*) INTO v_bid_count
  FROM contractor_bids cb
  WHERE cb.report_id = p_report_id;
  
  -- Count AGPO-qualified bids
  SELECT COUNT(*) INTO v_agpo_bids
  FROM contractor_bids cb
  JOIN contractor_profiles cp ON cp.user_id = cb.contractor_id
  WHERE cb.report_id = p_report_id
  AND cp.is_agpo = true
  AND cp.agpo_verified = true;
  
  -- Determine minimum requirements based on project value
  v_estimated_cost := COALESCE(v_report.cost, 0);
  
  IF v_report.is_emergency THEN
    v_min_required := 2;
  ELSIF v_estimated_cost > 1000000000 THEN -- > 1B KES
    v_min_required := 5;
  ELSE
    v_min_required := 3;
  END IF;
  
  -- AGPO requirements based on project value
  IF v_estimated_cost > 1000000000 THEN
    v_agpo_required := 3;
  ELSIF v_estimated_cost > 500000000 THEN
    v_agpo_required := 2;
  ELSE
    v_agpo_required := 1;
  END IF;
  
  -- If AGPO reserved, require AGPO bids
  IF v_report.is_agpo_reserved THEN
    v_agpo_required := GREATEST(v_agpo_required, 2);
  END IF;
  
  -- Calculate days remaining
  IF v_report.bidding_end_date IS NOT NULL THEN
    v_days_remaining := GREATEST(0, EXTRACT(DAY FROM v_report.bidding_end_date - now())::integer);
  ELSE
    v_days_remaining := 0;
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    (v_bid_count >= v_min_required) AND (v_agpo_bids >= v_agpo_required OR NOT v_report.is_agpo_reserved),
    v_bid_count,
    v_min_required,
    v_agpo_bids,
    v_agpo_required,
    (v_bid_count >= v_min_required) AND (v_agpo_bids >= v_agpo_required OR NOT v_report.is_agpo_reserved),
    v_report.extensions,
    v_days_remaining,
    CASE 
      WHEN v_bid_count < v_min_required THEN 
        format('Need %s more bids (have %s of %s required)', v_min_required - v_bid_count, v_bid_count, v_min_required)
      WHEN v_report.is_agpo_reserved AND v_agpo_bids < v_agpo_required THEN
        format('Need %s more AGPO-qualified bids', v_agpo_required - v_agpo_bids)
      ELSE 'Ready for approval'
    END;
END;
$$;

-- Create function to evaluate bids using 40-30-30 scoring
CREATE OR REPLACE FUNCTION public.evaluate_bid(
  p_bid_id uuid,
  p_evaluator_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  bid_id uuid,
  price_score numeric,
  technical_score numeric,
  experience_score numeric,
  agpo_bonus numeric,
  total_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
BEGIN
  -- Get bid details
  SELECT * INTO v_bid FROM contractor_bids WHERE id = p_bid_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;
  
  -- Get report details
  SELECT * INTO v_report FROM problem_reports WHERE id = v_bid.report_id;
  
  -- Get contractor profile
  SELECT * INTO v_contractor FROM contractor_profiles WHERE user_id = v_bid.contractor_id;
  
  -- Get minimum bid for this report (for price scoring)
  SELECT MIN(bid_amount) INTO v_min_bid
  FROM contractor_bids WHERE report_id = v_bid.report_id;
  
  -- Calculate Price Score (40% weight)
  -- Lower bids get higher scores
  IF v_bid.bid_amount > 0 AND v_min_bid > 0 THEN
    v_price_score := (v_min_bid / v_bid.bid_amount) * 40;
  ELSE
    v_price_score := 20; -- Default if no valid amounts
  END IF;
  
  -- Calculate Technical Score (30% weight)
  -- Based on proposal quality (length, technical approach presence)
  v_technical_score := 15; -- Base score
  IF v_bid.technical_approach IS NOT NULL AND LENGTH(v_bid.technical_approach) > 100 THEN
    v_technical_score := v_technical_score + 10;
  END IF;
  IF LENGTH(v_bid.proposal) > 200 THEN
    v_technical_score := v_technical_score + 5;
  END IF;
  v_technical_score := LEAST(v_technical_score, 30); -- Cap at 30
  
  -- Calculate Experience Score (30% weight)
  IF v_contractor IS NOT NULL THEN
    v_experience_score := 0;
    -- Years in business (max 10 points)
    v_experience_score := v_experience_score + LEAST(COALESCE(v_contractor.years_in_business, 0), 10);
    -- Previous projects (max 10 points)
    v_experience_score := v_experience_score + LEAST(COALESCE(v_contractor.previous_projects_count, 0), 10);
    -- Rating bonus (max 10 points based on 5-star rating)
    v_experience_score := v_experience_score + (COALESCE(v_contractor.average_rating, 0) * 2);
  ELSE
    v_experience_score := 15; -- Default if no profile
  END IF;
  v_experience_score := LEAST(v_experience_score, 30); -- Cap at 30
  
  -- AGPO Bonus (+5% for qualified contractors)
  IF v_contractor IS NOT NULL AND v_contractor.is_agpo = true AND v_contractor.agpo_verified = true THEN
    v_agpo_bonus := 5;
  END IF;
  
  -- Calculate total score
  v_total_score := v_price_score + v_technical_score + v_experience_score + v_agpo_bonus;
  
  -- Update bid with scores
  UPDATE contractor_bids
  SET 
    price_score = v_price_score,
    technical_score = v_technical_score,
    experience_score = v_experience_score,
    agpo_bonus = v_agpo_bonus,
    total_score = v_total_score,
    evaluation_notes = p_notes,
    evaluated_at = now(),
    evaluated_by = p_evaluator_id
  WHERE id = p_bid_id;
  
  -- Create audit record
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
    p_bid_id,
    v_price_score,
    v_technical_score,
    v_experience_score,
    v_agpo_bonus,
    v_total_score;
END;
$$;

-- Create function to open bidding for approved projects
CREATE OR REPLACE FUNCTION public.open_bidding_for_project(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE problem_reports
  SET 
    bidding_status = 'open',
    bidding_start_date = now(),
    bidding_end_date = now() + INTERVAL '7 days',
    bidding_extensions = 0,
    min_bids_required = CASE 
      WHEN is_emergency THEN 2
      WHEN COALESCE(estimated_cost, 0) > 1000000000 THEN 5
      ELSE 3
    END
  WHERE id = p_report_id
  AND status = 'approved';
END;
$$;

-- Create function to extend bidding window
CREATE OR REPLACE FUNCTION public.extend_bidding_window(p_report_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extensions integer;
BEGIN
  SELECT bidding_extensions INTO v_extensions
  FROM problem_reports
  WHERE id = p_report_id;
  
  IF v_extensions >= 2 THEN
    RETURN false; -- Max 2 extensions allowed
  END IF;
  
  UPDATE problem_reports
  SET 
    bidding_end_date = bidding_end_date + INTERVAL '7 days',
    bidding_extensions = bidding_extensions + 1
  WHERE id = p_report_id;
  
  RETURN true;
END;
$$;

-- Create function to get top 3 bids for approval
CREATE OR REPLACE FUNCTION public.get_top_bids_for_approval(p_report_id uuid)
RETURNS TABLE (
  bid_id uuid,
  contractor_id uuid,
  contractor_name text,
  bid_amount numeric,
  estimated_duration integer,
  price_score numeric,
  technical_score numeric,
  experience_score numeric,
  agpo_bonus numeric,
  total_score numeric,
  is_agpo boolean,
  rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cb.id as bid_id,
    cb.contractor_id,
    COALESCE(cp.company_name, 'Unknown Contractor') as contractor_name,
    cb.bid_amount,
    cb.estimated_duration,
    cb.price_score,
    cb.technical_score,
    cb.experience_score,
    cb.agpo_bonus,
    cb.total_score,
    COALESCE(cp.is_agpo, false) as is_agpo,
    ROW_NUMBER() OVER (ORDER BY cb.total_score DESC)::integer as rank
  FROM contractor_bids cb
  LEFT JOIN contractor_profiles cp ON cp.user_id = cb.contractor_id
  WHERE cb.report_id = p_report_id
  AND cb.status = 'submitted'
  ORDER BY cb.total_score DESC
  LIMIT 3;
END;
$$;