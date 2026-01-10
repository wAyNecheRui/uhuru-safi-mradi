-- Fix the existing project that has a selected bid but no contractor_id
UPDATE projects 
SET 
  contractor_id = (
    SELECT contractor_id 
    FROM contractor_bids 
    WHERE contractor_bids.status = 'selected' 
    AND contractor_bids.report_id = projects.report_id
    LIMIT 1
  ),
  status = 'in_progress',
  updated_at = NOW()
WHERE contractor_id IS NULL 
AND report_id IN (
  SELECT report_id 
  FROM contractor_bids 
  WHERE status = 'selected'
);