
-- RACE CONDITION FIX #1: Prevent duplicate bids from same contractor on same report
-- This is a partial unique index that only applies to non-deleted bids
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_bid_per_contractor_report 
ON public.contractor_bids (report_id, contractor_id) 
WHERE deleted_at IS NULL;

-- RACE CONDITION FIX #2: Prevent duplicate completed payments for same milestone
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completed_milestone_payment
ON public.payment_transactions (milestone_id, transaction_type)
WHERE status = 'completed' AND milestone_id IS NOT NULL;
