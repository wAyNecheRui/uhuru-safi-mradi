-- Fix Damaged Transformer: Overfunded - held + released (1.02M) > total (850K)
-- The released amount is 170K, so we need to adjust held to match what's left
-- Total budget is 850K, released is 170K, so held should be 680K max
UPDATE escrow_accounts 
SET held_amount = total_amount - released_amount, updated_at = now()
WHERE id = 'a404a679-05a0-4dd0-b747-3b98c190df5d'
  AND (held_amount + released_amount) > total_amount;

-- Update project statuses to match escrow status where all funds released
UPDATE projects 
SET status = 'completed', updated_at = now()
WHERE id IN (
  SELECT e.project_id 
  FROM escrow_accounts e 
  WHERE e.status = 'completed' 
    AND e.held_amount = 0 
    AND e.released_amount >= e.total_amount
)
AND status != 'completed';