-- Fix Damaged Transformer escrow with correct ID
-- held=850K, released=170K, total=850K -> overfunded
-- Correct held should be: 850K - 170K = 680K
UPDATE escrow_accounts 
SET held_amount = 680000, updated_at = now()
WHERE id = 'b5c31e75-7988-4912-96fb-35b0ffcc200d';