CREATE POLICY "Citizens view payments for transparency"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);