-- Fix the stuck report that has 3+ votes but is still pending
UPDATE public.problem_reports 
SET status = 'under_review', updated_at = now()
WHERE id IN (
  SELECT pr.id 
  FROM public.problem_reports pr
  WHERE pr.status = 'pending'
  AND (SELECT COUNT(*) FROM public.community_votes cv WHERE cv.report_id = pr.id) >= 3
);

-- Create a trigger function to automatically transition reports to under_review when they reach 3 votes
CREATE OR REPLACE FUNCTION public.check_vote_threshold_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vote_count INTEGER;
  current_status TEXT;
BEGIN
  -- Count total votes for this report
  SELECT COUNT(*) INTO vote_count
  FROM public.community_votes
  WHERE report_id = NEW.report_id;
  
  -- Get current status of the report
  SELECT status INTO current_status
  FROM public.problem_reports
  WHERE id = NEW.report_id;
  
  -- If threshold reached (3 votes) and still pending, transition to under_review
  IF vote_count >= 3 AND current_status = 'pending' THEN
    UPDATE public.problem_reports
    SET status = 'under_review', updated_at = now()
    WHERE id = NEW.report_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after each vote insert
DROP TRIGGER IF EXISTS check_vote_threshold_on_vote ON public.community_votes;
CREATE TRIGGER check_vote_threshold_on_vote
  AFTER INSERT ON public.community_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vote_threshold_transition();