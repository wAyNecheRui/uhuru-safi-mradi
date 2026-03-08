
-- Add worker wage allocation columns to escrow_accounts
ALTER TABLE public.escrow_accounts 
  ADD COLUMN IF NOT EXISTS worker_wage_allocation numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS worker_wage_released numeric NOT NULL DEFAULT 0;

-- Add escrow_account_id to worker_payments for audit trail
ALTER TABLE public.worker_payments 
  ADD COLUMN IF NOT EXISTS escrow_account_id uuid REFERENCES public.escrow_accounts(id);

-- Add worker_phone to worker_payments for M-Pesa B2C
ALTER TABLE public.worker_payments 
  ADD COLUMN IF NOT EXISTS worker_phone text;

-- Create trigger to auto-pay worker from escrow when attendance is verified
CREATE OR REPLACE FUNCTION public.trigger_worker_escrow_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when verification_status changes to 'verified'
  IF NEW.verification_status = 'verified' AND (OLD.verification_status IS DISTINCT FROM 'verified') THEN
    -- Call edge function via pg_net or just mark ready for payment
    -- The actual M-Pesa B2C is handled by the edge function
    -- We mark the record as ready for escrow payment
    NEW.payment_status := 'processing';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_worker_attendance_verified ON public.worker_daily_records;
CREATE TRIGGER on_worker_attendance_verified
  BEFORE UPDATE ON public.worker_daily_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_worker_escrow_payment();

-- RLS: Allow workers to view their own payments
DROP POLICY IF EXISTS "Workers view own payments" ON public.worker_payments;
CREATE POLICY "Workers view own payments"
  ON public.worker_payments
  FOR SELECT
  USING (auth.uid() = worker_id);

-- RLS: Allow contractors (job creators) to view worker payments for their jobs
DROP POLICY IF EXISTS "Job creators view worker payments" ON public.worker_payments;
CREATE POLICY "Job creators view worker payments"
  ON public.worker_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workforce_jobs wj
      WHERE wj.id = worker_payments.job_id AND wj.created_by = auth.uid()
    )
  );

-- RLS: Government can view all worker payments
DROP POLICY IF EXISTS "Government view worker payments" ON public.worker_payments;
CREATE POLICY "Government view worker payments"
  ON public.worker_payments
  FOR SELECT
  USING (get_user_type(auth.uid()) = 'government');

-- Citizens can view escrow accounts (add worker wage transparency)
DROP POLICY IF EXISTS "Citizens view escrow for transparency" ON public.escrow_accounts;
CREATE POLICY "Citizens view escrow for transparency"
  ON public.escrow_accounts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
