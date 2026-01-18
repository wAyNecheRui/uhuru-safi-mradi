-- Fix: Update milestone to 'paid' status (was missed due to UUID error)
UPDATE project_milestones
SET status = 'paid', verified_at = now()
WHERE id = '6b62ade9-2ca8-4a77-8850-04e1450df1c2';