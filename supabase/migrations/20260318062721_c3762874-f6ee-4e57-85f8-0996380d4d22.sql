-- Fix: Add 'payment_processing' to allowed milestone statuses
ALTER TABLE project_milestones DROP CONSTRAINT project_milestones_status_check;
ALTER TABLE project_milestones ADD CONSTRAINT project_milestones_status_check 
  CHECK (status = ANY (ARRAY['pending', 'in_progress', 'submitted', 'verified', 'payment_processing', 'paid']));