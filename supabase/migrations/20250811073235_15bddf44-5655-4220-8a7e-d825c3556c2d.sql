-- Fix security warnings by properly dropping and recreating functions with dependencies

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_priority_score_trigger ON public.community_votes;
DROP TRIGGER IF EXISTS create_project_trigger ON public.problem_reports;

-- Drop the functions
DROP FUNCTION IF EXISTS update_priority_score();
DROP FUNCTION IF EXISTS create_project_from_report();

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION update_priority_score()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.problem_reports 
  SET priority_score = (
    SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
    FROM public.community_votes 
    WHERE report_id = COALESCE(NEW.report_id, OLD.report_id)
  )
  WHERE id = COALESCE(NEW.report_id, OLD.report_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION create_project_from_report()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.projects (
      report_id,
      title,
      description,
      budget,
      status
    ) VALUES (
      NEW.id,
      NEW.title,
      NEW.description,
      NEW.budget_allocated,
      'planning'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_priority_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.community_votes
  FOR EACH ROW EXECUTE FUNCTION update_priority_score();

CREATE TRIGGER create_project_trigger
  AFTER UPDATE ON public.problem_reports
  FOR EACH ROW EXECUTE FUNCTION create_project_from_report();