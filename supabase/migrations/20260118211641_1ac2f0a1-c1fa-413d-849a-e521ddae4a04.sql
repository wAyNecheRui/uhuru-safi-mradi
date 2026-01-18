-- Clean up duplicate milestones - handle foreign key constraints
-- First, update project_progress to point to the kept milestone

-- Step 1: Create a mapping of old milestone IDs to kept milestone IDs for duplicates
WITH ranked_milestones AS (
  SELECT 
    id,
    project_id,
    milestone_number,
    status,
    evidence_urls,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, milestone_number 
      ORDER BY 
        CASE status 
          WHEN 'paid' THEN 1 
          WHEN 'verified' THEN 2 
          WHEN 'submitted' THEN 3 
          WHEN 'in_progress' THEN 4 
          ELSE 5 
        END,
        CASE WHEN evidence_urls IS NOT NULL AND array_length(evidence_urls, 1) > 0 THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM project_milestones
),
kept_milestones AS (
  SELECT id, project_id, milestone_number FROM ranked_milestones WHERE rn = 1
),
duplicates_to_delete AS (
  SELECT rm.id as old_id, km.id as new_id
  FROM ranked_milestones rm
  JOIN kept_milestones km ON rm.project_id = km.project_id AND rm.milestone_number = km.milestone_number
  WHERE rm.rn > 1
)
-- Update project_progress to point to kept milestones
UPDATE project_progress pp
SET milestone_id = d.new_id
FROM duplicates_to_delete d
WHERE pp.milestone_id = d.old_id;

-- Step 2: Update milestone_verifications to point to kept milestones
WITH ranked_milestones AS (
  SELECT 
    id,
    project_id,
    milestone_number,
    status,
    evidence_urls,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, milestone_number 
      ORDER BY 
        CASE status 
          WHEN 'paid' THEN 1 
          WHEN 'verified' THEN 2 
          WHEN 'submitted' THEN 3 
          WHEN 'in_progress' THEN 4 
          ELSE 5 
        END,
        CASE WHEN evidence_urls IS NOT NULL AND array_length(evidence_urls, 1) > 0 THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM project_milestones
),
kept_milestones AS (
  SELECT id, project_id, milestone_number FROM ranked_milestones WHERE rn = 1
),
duplicates_to_delete AS (
  SELECT rm.id as old_id, km.id as new_id
  FROM ranked_milestones rm
  JOIN kept_milestones km ON rm.project_id = km.project_id AND rm.milestone_number = km.milestone_number
  WHERE rm.rn > 1
)
UPDATE milestone_verifications mv
SET milestone_id = d.new_id
FROM duplicates_to_delete d
WHERE mv.milestone_id = d.old_id;

-- Step 3: Update payment_transactions to point to kept milestones
WITH ranked_milestones AS (
  SELECT 
    id,
    project_id,
    milestone_number,
    status,
    evidence_urls,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, milestone_number 
      ORDER BY 
        CASE status 
          WHEN 'paid' THEN 1 
          WHEN 'verified' THEN 2 
          WHEN 'submitted' THEN 3 
          WHEN 'in_progress' THEN 4 
          ELSE 5 
        END,
        CASE WHEN evidence_urls IS NOT NULL AND array_length(evidence_urls, 1) > 0 THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM project_milestones
),
kept_milestones AS (
  SELECT id, project_id, milestone_number FROM ranked_milestones WHERE rn = 1
),
duplicates_to_delete AS (
  SELECT rm.id as old_id, km.id as new_id
  FROM ranked_milestones rm
  JOIN kept_milestones km ON rm.project_id = km.project_id AND rm.milestone_number = km.milestone_number
  WHERE rm.rn > 1
)
UPDATE payment_transactions pt
SET milestone_id = d.new_id
FROM duplicates_to_delete d
WHERE pt.milestone_id = d.old_id;

-- Step 4: Now delete the duplicate milestones
WITH ranked_milestones AS (
  SELECT 
    id,
    project_id,
    milestone_number,
    status,
    evidence_urls,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, milestone_number 
      ORDER BY 
        CASE status 
          WHEN 'paid' THEN 1 
          WHEN 'verified' THEN 2 
          WHEN 'submitted' THEN 3 
          WHEN 'in_progress' THEN 4 
          ELSE 5 
        END,
        CASE WHEN evidence_urls IS NOT NULL AND array_length(evidence_urls, 1) > 0 THEN 0 ELSE 1 END,
        created_at DESC
    ) as rn
  FROM project_milestones
)
DELETE FROM project_milestones
WHERE id IN (
  SELECT id FROM ranked_milestones WHERE rn > 1
);

-- Step 5: Add a unique constraint to prevent future duplicates
ALTER TABLE project_milestones 
ADD CONSTRAINT unique_project_milestone_number 
UNIQUE (project_id, milestone_number);