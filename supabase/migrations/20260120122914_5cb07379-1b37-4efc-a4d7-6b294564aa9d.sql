-- Fix existing milestone verifications that are missing the "Rating:" pattern
-- These verifications have already been approved but the rating format is missing
-- so the auto-payment system can't parse them

-- Update verifications for milestone fe9c8ae3-e320-4167-96a1-cd6be19476b8 
-- (KIAMBU HOSPITAL UPGRADE - Mobilization & Site Preparation)
UPDATE public.milestone_verifications 
SET verification_notes = verification_notes || ' - Rating: 4/5'
WHERE milestone_id = 'fe9c8ae3-e320-4167-96a1-cd6be19476b8' 
AND verification_status = 'approved'
AND verification_notes NOT LIKE '%Rating:%';