-- Fix Damaged Transformer escrow: held=850K, released=170K, total=850K
-- This is overfunded (1.02M vs 850K budget)
-- Correct held should be: 850K - 170K = 680K
UPDATE escrow_accounts 
SET held_amount = 680000, updated_at = now()
WHERE id = 'a404a679-05a0-4dd0-b747-3b98c190df5d';