
-- Fix: Update evaluate_bid function to count ACTUAL projects from the projects table
-- instead of relying on the stale previous_projects_count in contractor_profiles

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
BEGIN
  -- SECURITY: Validate required parameters
  IF p_bid_id IS NULL THEN
    RAISE EXCEPTION 'Bid ID is required';
  END IF;
  
  IF p_evaluator_id IS NULL THEN
    RAISE EXCEPTION 'Evaluator ID is required';
  END IF;
  
  -- SECURITY: Validate notes length to prevent data abuse
  IF p_notes IS NOT NULL AND length(p_notes) > 5000 THEN
    RAISE EXCEPTION 'Evaluation notes exceed maximum length of 5000 characters';
  END IF;
  
  -- SECURITY: Authorization check - only government users can evaluate bids
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type = 'government'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only government officials can evaluate bids';
  END IF;
  
  -- SECURITY: Evaluator ID must match authenticated user
  IF p_evaluator_id != auth.uid() THEN
    RAISE EXCEPTION 'Evaluator ID must match authenticated user';
  END IF;
  
  -- Get bid details with existence check
  SELECT * INTO v_bid FROM contractor_bids WHERE id = p_bid_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bid not found';
  END IF;
  
  -- Prevent re-evaluation of already evaluated bids
  IF v_bid.evaluated_at IS NOT NULL THEN
    RAISE EXCEPTION 'Bid has already been evaluated';
  END IF;
  
  -- Get report details
  SELECT * INTO v_report FROM problem_reports WHERE id = v_bid.report_id;
  
  -- Get contractor profile
  SELECT * INTO v_contractor FROM contractor_profiles WHERE user_id = v_bid.contractor_id;
  
  -- Count ACTUAL projects from the projects table (not the stale profile field)
  SELECT 
    COUNT(*)::integer,
    COUNT(CASE WHEN status IN ('completed', 'closed') THEN 1 END)::integer
  INTO v_actual_project_count, v_completed_project_count
  FROM projects 
  WHERE contractor_id = v_bid.contractor_id 
    AND deleted_at IS NULL;
  
  -- Get minimum bid for this report (for price scoring)
  SELECT MIN(bid_amount) INTO v_min_bid
  FROM contractor_bids WHERE report_id = v_bid.report_id;
  
  -- Calculate Price Score (40% weight)
  IF v_bid.bid_amount > 0 AND v_min_bid > 0 THEN
    v_price_score := (v_min_bid / v_bid.bid_amount) * 40;
  ELSE
    v_price_score := 20;
  END IF;
  
  -- Calculate Technical Score (30% weight)
  v_technical_score := 15;
  IF v_bid.technical_approach IS NOT NULL AND LENGTH(v_bid.technical_approach) > 100 THEN
    v_technical_score := v_technical_score + 10;
  END IF;
  IF LENGTH(v_bid.proposal) > 200 THEN
    v_technical_score := v_technical_score + 5;
  END IF;
  v_technical_score := LEAST(v_technical_score, 30);
  
  -- Calculate Experience Score (30% weight) using ACTUAL project counts
  IF v_contractor IS NOT NULL THEN
    v_experience_score := 0;
    -- Years in business: max 10 points
    v_experience_score := v_experience_score + LEAST(COALESCE(v_contractor.years_in_business, 0), 10);
    -- ACTUAL completed/active projects: max 10 points (using real data)
    v_experience_score := v_experience_score + LEAST(v_actual_project_count, 10);
    -- Average rating: max 10 points (rating * 2)
    v_experience_score := v_experience_score + (COALESCE(v_contractor.average_rating, 0) * 2);
  ELSE
    v_experience_score := 15;
  END IF;
  v_experience_score := LEAST(v_experience_score, 30);
  
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
$function$;

-- Also update the get_top_bids_for_approval function to show actual project counts
CREATE OR REPLACE FUNCTION public.get_top_bids_for_approval(p_report_id uuid)
 RETURNS TABLE(bid_id uuid, contractor_id uuid, contractor_name text, bid_amount numeric, estimated_duration integer, price_score numeric, technical_score numeric, experience_score numeric, agpo_bonus numeric, total_score numeric, is_agpo boolean, agpo_category text, years_in_business integer, previous_projects_count integer, max_project_capacity numeric, rank integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    cp.agpo_category,
    cp.years_in_business,
    -- Return ACTUAL project count from projects table instead of stale profile field
    (SELECT COUNT(*)::integer FROM projects p WHERE p.contractor_id = cb.contractor_id AND p.deleted_at IS NULL) as previous_projects_count,
    cp.max_project_capacity,
    ROW_NUMBER() OVER (ORDER BY cb.total_score DESC)::integer as rank
  FROM contractor_bids cb
  LEFT JOIN contractor_profiles cp ON cp.user_id = cb.contractor_id
  WHERE cb.report_id = p_report_id
    AND cb.status IN ('submitted', 'evaluated')
    AND cb.deleted_at IS NULL
  ORDER BY cb.total_score DESC
  LIMIT 3;
END;
$function$;

-- Also sync the contractor_profiles.previous_projects_count for consistency
-- This updates all contractor profiles with their actual project counts
UPDATE contractor_profiles cp
SET previous_projects_count = (
  SELECT COUNT(*)::integer 
  FROM projects p 
  WHERE p.contractor_id = cp.user_id 
    AND p.deleted_at IS NULL
);
