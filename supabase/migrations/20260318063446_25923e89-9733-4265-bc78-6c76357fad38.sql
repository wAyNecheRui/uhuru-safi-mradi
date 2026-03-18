-- FIX 1: Remove the broken trigger that references wrong table columns
-- update_priority_score() uses NEW.priority which doesn't exist on community_votes
DROP TRIGGER IF EXISTS update_priority_score_trigger ON community_votes;

-- FIX 2: Fix the vote threshold trigger function to count upvotes (not 'verify' which doesn't exist)
-- The system uses 'upvote'/'downvote' vote types, threshold is 3 votes for auto-transition
CREATE OR REPLACE FUNCTION public.check_vote_threshold_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vote_count INTEGER;
  report_status TEXT;
BEGIN
  -- Count total votes (upvotes count as positive engagement)
  SELECT COUNT(*) INTO vote_count
  FROM community_votes cv
  WHERE cv.report_id = NEW.report_id;

  -- Get current report status
  SELECT status INTO report_status
  FROM problem_reports
  WHERE id = NEW.report_id;

  -- Auto-transition from 'pending' to 'under_review' at 3+ votes
  IF vote_count >= 3 AND report_status = 'pending' THEN
    UPDATE problem_reports 
    SET status = 'under_review', 
        verified_votes = vote_count,
        updated_at = now()
    WHERE id = NEW.report_id
      AND status = 'pending';
    
    RAISE LOG '[VOTE-THRESHOLD] Report % transitioned to under_review with % votes', 
      NEW.report_id, vote_count;
  ELSE
    -- Still update the vote count
    UPDATE problem_reports
    SET verified_votes = vote_count,
        updated_at = now()
    WHERE id = NEW.report_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- FIX 3: Ensure the priority score trigger is ONLY on problem_reports (where it belongs)
-- First check if it already exists there
DROP TRIGGER IF EXISTS update_priority_score_on_report ON problem_reports;
CREATE TRIGGER update_priority_score_on_report
  BEFORE INSERT OR UPDATE ON problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_priority_score();