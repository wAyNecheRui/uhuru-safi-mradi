-- =============================================
-- SECURITY FIX 1: Remove hardcoded encryption key
-- Replace with Vault-based secret retrieval
-- =============================================

-- First, create the secret in vault (this needs to be done via Supabase dashboard)
-- For now, we'll create a secure function that requires the key from vault

-- Drop existing functions first to recreate with secure implementation
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(text, text);
DROP FUNCTION IF EXISTS public.decrypt_sensitive_data(text, text);

-- Create secure encryption function that retrieves key from vault
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN data;
  END IF;
  
  -- Try to get key from vault first
  BEGIN
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CITIZEN_DATA_ENCRYPTION_KEY'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    encryption_key := NULL;
  END;
  
  -- Fallback to environment variable if vault not available
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := current_setting('app.encryption_key', true);
  END IF;
  
  -- If still no key, raise an error (fail secure)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured. Please set CITIZEN_DATA_ENCRYPTION_KEY in Supabase Vault.';
  END IF;
  
  RETURN encode(encrypt(data::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$;

-- Create secure decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN encrypted_data;
  END IF;
  
  -- Try to get key from vault first
  BEGIN
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CITIZEN_DATA_ENCRYPTION_KEY'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    encryption_key := NULL;
  END;
  
  -- Fallback to environment variable if vault not available
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := current_setting('app.encryption_key', true);
  END IF;
  
  -- If still no key, return masked data
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RETURN '***ENCRYPTED***';
  END IF;
  
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Return masked data if decryption fails (for backwards compatibility during migration)
    RETURN '***ENCRYPTED***';
END;
$$;

-- =============================================
-- SECURITY FIX 2: Add authorization and validation to RPC functions
-- =============================================

-- Fix evaluate_bid function with authorization and input validation
CREATE OR REPLACE FUNCTION public.evaluate_bid(p_bid_id uuid, p_evaluator_id uuid, p_notes text DEFAULT NULL::text)
RETURNS TABLE(bid_id uuid, price_score numeric, technical_score numeric, experience_score numeric, agpo_bonus numeric, total_score numeric)
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
  
  -- Calculate Experience Score (30% weight)
  IF v_contractor IS NOT NULL THEN
    v_experience_score := 0;
    v_experience_score := v_experience_score + LEAST(COALESCE(v_contractor.years_in_business, 0), 10);
    v_experience_score := v_experience_score + LEAST(COALESCE(v_contractor.previous_projects_count, 0), 10);
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
$$;

-- Fix open_bidding_for_project with authorization
CREATE OR REPLACE FUNCTION public.open_bidding_for_project(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Validate input
  IF p_report_id IS NULL THEN
    RAISE EXCEPTION 'Report ID is required';
  END IF;
  
  -- SECURITY: Authorization check - only government users
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type = 'government'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only government officials can open bidding';
  END IF;
  
  -- Verify report exists and is approved
  IF NOT EXISTS (SELECT 1 FROM problem_reports WHERE id = p_report_id AND status = 'approved') THEN
    RAISE EXCEPTION 'Report not found or not approved for bidding';
  END IF;

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

-- Fix extend_bidding_window with authorization
CREATE OR REPLACE FUNCTION public.extend_bidding_window(p_report_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extensions integer;
  v_bidding_status text;
BEGIN
  -- SECURITY: Validate input
  IF p_report_id IS NULL THEN
    RAISE EXCEPTION 'Report ID is required';
  END IF;
  
  -- SECURITY: Authorization check - only government users
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type = 'government'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only government officials can extend bidding';
  END IF;
  
  SELECT bidding_extensions, bidding_status INTO v_extensions, v_bidding_status
  FROM problem_reports
  WHERE id = p_report_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;
  
  IF v_bidding_status != 'open' THEN
    RAISE EXCEPTION 'Cannot extend: bidding is not open';
  END IF;
  
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

-- Fix check_bid_requirements with authorization
CREATE OR REPLACE FUNCTION public.check_bid_requirements(p_report_id uuid)
RETURNS TABLE(meets_requirements boolean, bid_count integer, min_required integer, agpo_bids integer, agpo_required integer, can_approve boolean, extension_count integer, days_remaining integer, status_message text)
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
  -- SECURITY: Validate input
  IF p_report_id IS NULL THEN
    RAISE EXCEPTION 'Report ID is required';
  END IF;
  
  -- SECURITY: Authorization check - only government users can check bid requirements
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type = 'government'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only government officials can check bid requirements';
  END IF;
  
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
  SELECT COUNT(*)::integer INTO v_bid_count
  FROM contractor_bids cb
  WHERE cb.report_id = p_report_id;
  
  -- Count AGPO-qualified bids
  SELECT COUNT(*)::integer INTO v_agpo_bids
  FROM contractor_bids cb
  JOIN contractor_profiles cp ON cp.user_id = cb.contractor_id
  WHERE cb.report_id = p_report_id
  AND cp.is_agpo = true
  AND cp.agpo_verified = true;
  
  -- Determine minimum requirements based on project value
  v_estimated_cost := COALESCE(v_report.cost, 0);
  
  IF v_report.is_emergency THEN
    v_min_required := 2;
  ELSIF v_estimated_cost > 1000000000 THEN
    v_min_required := 5;
  ELSE
    v_min_required := 3;
  END IF;
  
  -- AGPO requirements
  IF v_estimated_cost > 1000000000 THEN
    v_agpo_required := 3;
  ELSIF v_estimated_cost > 500000000 THEN
    v_agpo_required := 2;
  ELSE
    v_agpo_required := 1;
  END IF;
  
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

-- Fix get_problems_with_distance with coordinate validation
CREATE OR REPLACE FUNCTION public.get_problems_with_distance(user_lat numeric, user_lon numeric, max_distance_km numeric DEFAULT 20)
RETURNS TABLE(id uuid, title text, description text, category text, priority text, status text, location text, coordinates text, county text, constituency text, ward text, estimated_cost numeric, affected_population integer, priority_score integer, verified_votes integer, created_at timestamp with time zone, photo_urls text[], distance_km numeric, distance_category text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Validate coordinate ranges
  IF user_lat IS NULL OR user_lon IS NULL THEN
    RAISE EXCEPTION 'Latitude and longitude are required';
  END IF;
  
  IF user_lat < -90 OR user_lat > 90 THEN
    RAISE EXCEPTION 'Invalid latitude: must be between -90 and 90';
  END IF;
  
  IF user_lon < -180 OR user_lon > 180 THEN
    RAISE EXCEPTION 'Invalid longitude: must be between -180 and 180';
  END IF;
  
  -- SECURITY: Validate max distance (prevent resource exhaustion)
  IF max_distance_km IS NULL OR max_distance_km <= 0 THEN
    max_distance_km := 20;
  ELSIF max_distance_km > 500 THEN
    max_distance_km := 500; -- Cap at 500km
  END IF;

  RETURN QUERY
  SELECT 
    pr.id,
    pr.title,
    pr.description,
    pr.category,
    pr.priority,
    pr.status,
    pr.location,
    pr.coordinates,
    (SELECT up.county FROM user_profiles up WHERE up.user_id = pr.reported_by LIMIT 1) as county,
    pr.constituency,
    pr.ward,
    pr.estimated_cost,
    pr.affected_population,
    pr.priority_score,
    pr.verified_votes,
    pr.created_at,
    pr.photo_urls,
    CASE 
      WHEN pr.coordinates IS NOT NULL AND pr.coordinates LIKE '%,%' THEN
        calculate_distance_km(
          user_lat,
          user_lon,
          CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
          CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
        )
      ELSE NULL
    END as distance_km,
    CASE 
      WHEN pr.coordinates IS NOT NULL AND pr.coordinates LIKE '%,%' THEN
        CASE
          WHEN calculate_distance_km(
            user_lat,
            user_lon,
            CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
            CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
          ) <= 5 THEN 'urgent'
          WHEN calculate_distance_km(
            user_lat,
            user_lon,
            CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
            CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
          ) <= 10 THEN 'nearby'
          ELSE 'county'
        END
      ELSE 'unknown'
    END as distance_category
  FROM problem_reports pr
  WHERE pr.status NOT IN ('rejected', 'completed')
  AND (
    pr.coordinates IS NULL 
    OR pr.coordinates NOT LIKE '%,%'
    OR calculate_distance_km(
      user_lat,
      user_lon,
      CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
      CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
    ) <= max_distance_km
  )
  ORDER BY 
    CASE 
      WHEN pr.coordinates IS NOT NULL AND pr.coordinates LIKE '%,%' THEN
        calculate_distance_km(
          user_lat,
          user_lon,
          CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
          CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
        )
      ELSE 9999
    END ASC
  LIMIT 100; -- SECURITY: Limit results to prevent resource exhaustion
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.encrypt_sensitive_data(text) IS 'Securely encrypts sensitive data using key from Supabase Vault. Key must be stored as CITIZEN_DATA_ENCRYPTION_KEY in vault.';
COMMENT ON FUNCTION public.decrypt_sensitive_data(text) IS 'Decrypts data encrypted by encrypt_sensitive_data. Requires CITIZEN_DATA_ENCRYPTION_KEY in vault.';
COMMENT ON FUNCTION public.evaluate_bid(uuid, uuid, text) IS 'Evaluates a contractor bid. Requires government role authorization.';
COMMENT ON FUNCTION public.open_bidding_for_project(uuid) IS 'Opens bidding for an approved project. Requires government role authorization.';
COMMENT ON FUNCTION public.extend_bidding_window(uuid) IS 'Extends bidding window by 7 days. Max 2 extensions. Requires government role authorization.';
COMMENT ON FUNCTION public.check_bid_requirements(uuid) IS 'Checks if bid requirements are met for approval. Requires government role authorization.';