-- Fix Multimedia Drainage: All funds released, mark escrow as completed
UPDATE escrow_accounts 
SET status = 'completed', updated_at = now()
WHERE id = '2d34d1b3-4af2-4a5d-bc59-0910e6a78893'
  AND held_amount = 0 
  AND released_amount >= total_amount;

-- Fix Kiambu Hospital: Overfunded - set held_amount to 0 since full budget already released
-- The 5M released already equals the budget, so the extra 2M held is an error
UPDATE escrow_accounts 
SET held_amount = 0, updated_at = now()
WHERE id = '7856388b-56f2-4616-8260-9a2eb11cb061'
  AND released_amount >= total_amount;

-- Also mark Kiambu as completed since all funds released
UPDATE escrow_accounts 
SET status = 'completed', updated_at = now()
WHERE id = '7856388b-56f2-4616-8260-9a2eb11cb061'
  AND held_amount = 0 
  AND released_amount >= total_amount;