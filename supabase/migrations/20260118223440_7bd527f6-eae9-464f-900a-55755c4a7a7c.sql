-- Add policy to allow citizens to view payment transactions for transparency
-- This ensures the public can track how project funds are being disbursed
CREATE POLICY "Citizens can view payment transactions for transparency"
  ON public.payment_transactions
  FOR SELECT
  USING (true);