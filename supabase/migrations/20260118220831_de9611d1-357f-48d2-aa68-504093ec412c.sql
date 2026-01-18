-- Fix: Ensure milestone_verifications has unique constraint per citizen per milestone
-- This prevents duplicate citizen votes on the same milestone

CREATE UNIQUE INDEX IF NOT EXISTS unique_citizen_milestone_verification 
ON public.milestone_verifications (milestone_id, verifier_id);

-- Retroactively create milestone verifications from existing quality_checkpoints
-- for Kiambu Hospital project (or any project with quality ratings but missing milestone verifications)
INSERT INTO public.milestone_verifications (milestone_id, verifier_id, verification_status, verification_notes, verification_photos)
SELECT 
  pm.id as milestone_id,
  qc.inspector_id as verifier_id,
  'approved' as verification_status,
  'Citizen Quality Review - Rating: ' || (qc.score / 20)::text || '/5. Auto-migrated from quality checkpoint.' as verification_notes,
  ARRAY[]::text[] as verification_photos
FROM quality_checkpoints qc
JOIN projects p ON p.id = qc.project_id
JOIN project_milestones pm ON pm.project_id = p.id
WHERE qc.inspector_type = 'citizen'
  AND qc.checkpoint_name = 'Citizen Quality Review'
  AND pm.milestone_number = 1 -- Assign to first milestone
  AND NOT EXISTS (
    SELECT 1 FROM milestone_verifications mv 
    WHERE mv.milestone_id = pm.id AND mv.verifier_id = qc.inspector_id
  );

-- Update first milestone to 'submitted' status if it has quality ratings (contractor should have submitted)
UPDATE project_milestones
SET status = 'submitted'
WHERE id IN (
  SELECT pm.id
  FROM project_milestones pm
  JOIN projects p ON p.id = pm.project_id
  WHERE pm.milestone_number = 1
    AND pm.status = 'pending'
    AND EXISTS (
      SELECT 1 FROM quality_checkpoints qc 
      WHERE qc.project_id = p.id 
        AND qc.inspector_type = 'citizen'
    )
);