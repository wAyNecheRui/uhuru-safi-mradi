-- Widen the projects.status CHECK constraint to accept the full canonical workflow vocabulary.
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status = ANY (ARRAY[
    'planning',                -- legacy, kept for safety
    'pending',
    'under_review',
    'approved',
    'bidding_open',
    'contractor_selected',
    'funded',
    'in_progress',
    'under_verification',
    'completed',
    'rejected',
    'cancelled'
  ]));

-- Now backfill legacy 'planning' rows.
UPDATE public.projects
SET status = 'contractor_selected'
WHERE deleted_at IS NULL
  AND status = 'planning'
  AND contractor_id IS NOT NULL;

UPDATE public.projects p
SET status = COALESCE(r.status, 'bidding_open')
FROM public.problem_reports r
WHERE p.report_id = r.id
  AND p.deleted_at IS NULL
  AND p.status = 'planning'
  AND p.contractor_id IS NULL
  AND r.status IN ('bidding_open', 'under_review', 'approved', 'pending');

UPDATE public.projects
SET status = 'bidding_open'
WHERE deleted_at IS NULL
  AND status = 'planning';