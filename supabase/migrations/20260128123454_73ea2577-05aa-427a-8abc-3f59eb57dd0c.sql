-- Fix report status inconsistencies where project status is more advanced
-- This syncs problem_reports status with the actual project status

-- Fix completed projects with non-completed report status
UPDATE problem_reports
SET status = 'completed', updated_at = now()
WHERE id IN (
  SELECT pr.id
  FROM problem_reports pr
  JOIN projects p ON p.report_id = pr.id AND p.deleted_at IS NULL
  WHERE pr.deleted_at IS NULL
    AND p.status = 'completed'
    AND pr.status != 'completed'
);

-- Fix in_progress projects where report is still at earlier status
UPDATE problem_reports
SET status = 'in_progress', updated_at = now()
WHERE id IN (
  SELECT pr.id
  FROM problem_reports pr
  JOIN projects p ON p.report_id = pr.id AND p.deleted_at IS NULL
  WHERE pr.deleted_at IS NULL
    AND p.status = 'in_progress'
    AND pr.status NOT IN ('in_progress', 'completed')
);

-- Create a trigger function to auto-sync report status when project status changes
CREATE OR REPLACE FUNCTION public.sync_report_status_from_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only sync if project has a linked report
  IF NEW.report_id IS NOT NULL THEN
    -- Sync status: completed project -> completed report
    IF NEW.status = 'completed' THEN
      UPDATE problem_reports
      SET status = 'completed', updated_at = now()
      WHERE id = NEW.report_id AND status != 'completed';
    -- Sync status: in_progress project -> in_progress report (if not already completed)
    ELSIF NEW.status = 'in_progress' THEN
      UPDATE problem_reports
      SET status = 'in_progress', updated_at = now()
      WHERE id = NEW.report_id AND status NOT IN ('in_progress', 'completed');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_report_status_on_project_update ON projects;
CREATE TRIGGER sync_report_status_on_project_update
  AFTER UPDATE OF status ON projects
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_report_status_from_project();