-- Clean up duplicate milestones for KIAMBU HOSPITAL UPGRADE project
-- Use created_at to determine which to keep (keep earliest)

DELETE FROM project_milestones pm1
WHERE pm1.project_id = '160df31a-eb30-4148-8c13-3c55dc9e79a7'
AND EXISTS (
  SELECT 1 FROM project_milestones pm2
  WHERE pm2.project_id = pm1.project_id
  AND pm2.milestone_number = pm1.milestone_number
  AND pm2.created_at < pm1.created_at
);

-- Verify and ensure milestone_number 3 and 4 have correct titles
UPDATE project_milestones 
SET title = 'Main Works Completion'
WHERE project_id = '160df31a-eb30-4148-8c13-3c55dc9e79a7' 
AND milestone_number = 3;

UPDATE project_milestones 
SET title = 'Final Inspection & Handover'
WHERE project_id = '160df31a-eb30-4148-8c13-3c55dc9e79a7' 
AND milestone_number = 4;