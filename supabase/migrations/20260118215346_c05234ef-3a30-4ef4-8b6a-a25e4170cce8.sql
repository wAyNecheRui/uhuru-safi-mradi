-- Fix workflow integrity:
-- 1) Allow contractors to move their own milestones to in_progress/submitted and attach evidence (RLS)
-- 2) Prevent citizens from rating project quality multiple times (dedupe + unique index)

-- 1) Contractors can update milestones for projects they own (restricted statuses)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='project_milestones'
      AND policyname='Contractors can submit milestone evidence'
  ) THEN
    CREATE POLICY "Contractors can submit milestone evidence"
    ON public.project_milestones
    FOR UPDATE
    TO public
    USING (
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_milestones.project_id
          AND p.contractor_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_milestones.project_id
          AND p.contractor_id = auth.uid()
      )
      AND project_milestones.status IN ('in_progress','submitted')
      AND project_milestones.verified_at IS NULL
      AND project_milestones.verified_by IS NULL
    );
  END IF;
END $$;

-- 2) Deduplicate citizen quality reviews (keep newest per citizen per project)
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY project_id, inspector_id
           ORDER BY created_at DESC
         ) AS rn
  FROM public.quality_checkpoints
  WHERE inspector_type='citizen'
    AND checkpoint_name='Citizen Quality Review'
)
DELETE FROM public.quality_checkpoints qc
USING ranked r
WHERE qc.id = r.id
  AND r.rn > 1;

-- 2b) Enforce one citizen quality review per project
CREATE UNIQUE INDEX IF NOT EXISTS unique_citizen_quality_review_per_project
ON public.quality_checkpoints (project_id, inspector_id)
WHERE inspector_type='citizen'
  AND checkpoint_name='Citizen Quality Review';
