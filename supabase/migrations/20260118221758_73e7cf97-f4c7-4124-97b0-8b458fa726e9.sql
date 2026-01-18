-- Fix: Assign missing roles to users with profiles
INSERT INTO user_roles (user_id, role)
SELECT up.user_id, up.user_type::app_role
FROM user_profiles up
LEFT JOIN user_roles ur ON ur.user_id = up.user_id
WHERE ur.role IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Add unique constraint on milestone_verifications if not exists (ensure one vote per citizen per milestone)
-- Already added in previous migration, but verify it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'unique_citizen_milestone_verification'
  ) THEN
    CREATE UNIQUE INDEX unique_citizen_milestone_verification 
    ON public.milestone_verifications (milestone_id, verifier_id);
  END IF;
END $$;

-- Ensure quality checkpoints unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'unique_citizen_quality_review_per_project'
  ) THEN
    CREATE UNIQUE INDEX unique_citizen_quality_review_per_project 
    ON public.quality_checkpoints (project_id, inspector_id) 
    WHERE inspector_type = 'citizen' AND checkpoint_name = 'Citizen Quality Review';
  END IF;
END $$;