-- Add unique constraint to prevent duplicate citizen verifications on the same milestone
ALTER TABLE milestone_verifications 
ADD CONSTRAINT unique_milestone_verifier 
UNIQUE (milestone_id, verifier_id);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_milestone_verifications_lookup 
ON milestone_verifications(milestone_id, verifier_id);