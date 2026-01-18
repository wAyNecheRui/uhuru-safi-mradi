-- Add policy to allow citizens to view escrow accounts for transparency
-- Citizens should be able to see escrow funding status on any project
CREATE POLICY "Citizens can view escrow accounts for transparency"
  ON public.escrow_accounts
  FOR SELECT
  USING (true);

-- Note: The existing "Payment visibility" policy is for contractors and government
-- This new policy allows anyone (including anonymous/citizen users) to view escrow data
-- This is important for public transparency of project funding