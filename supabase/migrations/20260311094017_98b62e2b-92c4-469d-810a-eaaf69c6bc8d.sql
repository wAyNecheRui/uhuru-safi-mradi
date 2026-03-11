
-- 1. Create a trigger function that auto-transitions milestones when verification threshold is met
-- This is the DATABASE-LEVEL safety net so milestones never get stuck at 'submitted'
CREATE OR REPLACE FUNCTION public.auto_verify_milestone_on_threshold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_approved_count INTEGER;
  v_total_rating NUMERIC := 0;
  v_rating_count INTEGER := 0;
  v_avg_rating NUMERIC := 0;
  v_milestone_status TEXT;
  v_rec RECORD;
BEGIN
  -- Only proceed on approved verifications
  IF NEW.verification_status != 'approved' THEN
    RETURN NEW;
  END IF;

  -- Get current milestone status
  SELECT status INTO v_milestone_status
  FROM project_milestones
  WHERE id = NEW.milestone_id;

  -- Only process if milestone is still in 'submitted' state
  IF v_milestone_status NOT IN ('submitted', 'in_progress') THEN
    RETURN NEW;
  END IF;

  -- Count approved verifications
  SELECT COUNT(*) INTO v_approved_count
  FROM milestone_verifications
  WHERE milestone_id = NEW.milestone_id
    AND verification_status = 'approved';

  -- Include the current NEW row if not yet visible
  -- (AFTER INSERT trigger should see it, but be safe)
  
  -- Calculate average rating from verification_notes
  FOR v_rec IN 
    SELECT verification_notes 
    FROM milestone_verifications 
    WHERE milestone_id = NEW.milestone_id 
      AND verification_status = 'approved'
  LOOP
    IF v_rec.verification_notes ~ 'Rating:\s*[\d.]+' THEN
      DECLARE
        v_rating NUMERIC;
      BEGIN
        v_rating := (regexp_match(v_rec.verification_notes, 'Rating:\s*([\d.]+)'))[1]::numeric;
        IF v_rating >= 1 AND v_rating <= 5 THEN
          v_total_rating := v_total_rating + v_rating;
          v_rating_count := v_rating_count + 1;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL; -- Skip unparseable ratings
      END;
    END IF;
  END LOOP;

  IF v_rating_count > 0 THEN
    v_avg_rating := v_total_rating / v_rating_count;
  END IF;

  -- Check if threshold is met: >= 2 approved verifications with avg rating >= 3
  IF v_approved_count >= 2 AND v_avg_rating >= 3 THEN
    -- Update milestone to 'verified' status as a safe intermediate state
    -- The edge function or frontend will then transition to 'payment_processing' -> 'paid'
    UPDATE project_milestones
    SET status = 'verified',
        verified_at = now()
    WHERE id = NEW.milestone_id
      AND status IN ('submitted', 'in_progress');
    
    RAISE LOG '[AUTO-VERIFY-TRIGGER] Milestone % auto-verified: % approvals, avg rating %.1', 
      NEW.milestone_id, v_approved_count, v_avg_rating;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create the trigger on milestone_verifications
DROP TRIGGER IF EXISTS trg_auto_verify_milestone ON milestone_verifications;
CREATE TRIGGER trg_auto_verify_milestone
  AFTER INSERT ON milestone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_verify_milestone_on_threshold();

-- 3. Fix the currently stuck milestone
UPDATE project_milestones 
SET status = 'verified', 
    verified_at = now()
WHERE id = 'ea7c5cb3-9d21-4999-b451-0095155025d1' 
  AND status = 'submitted';
