-- Drop the existing status check constraint
ALTER TABLE problem_reports DROP CONSTRAINT IF EXISTS problem_reports_status_check;

-- Add new constraint with all workflow statuses
ALTER TABLE problem_reports ADD CONSTRAINT problem_reports_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'bidding_open'::text, 'contractor_selected'::text, 'in_progress'::text, 'under_verification'::text, 'completed'::text, 'rejected'::text]));

-- Now update reports with 3+ votes to under_review status
UPDATE problem_reports 
SET status = 'under_review', updated_at = now()
WHERE priority_score >= 3 AND status = 'pending';