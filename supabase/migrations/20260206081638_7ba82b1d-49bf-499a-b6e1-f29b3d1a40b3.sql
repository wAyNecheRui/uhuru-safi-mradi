-- Create table to track worker attendance and daily work records
CREATE TABLE public.worker_daily_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.workforce_jobs(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  hours_worked NUMERIC(4,2) DEFAULT 8,
  daily_rate NUMERIC(10,2) NOT NULL,
  amount_earned NUMERIC(10,2) NOT NULL,
  verified_by UUID,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'processing', 'paid')),
  payment_transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_application_id, work_date)
);

-- Create table to track worker payments (separate from contractor milestone payments)
CREATE TABLE public.worker_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.workforce_jobs(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'mpesa',
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  daily_records_count INTEGER NOT NULL DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.worker_daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_payments ENABLE ROW LEVEL SECURITY;

-- RLS for worker_daily_records
-- Workers can view their own records
CREATE POLICY "Workers can view their own daily records"
ON public.worker_daily_records
FOR SELECT
USING (auth.uid() = worker_id);

-- Contractors can view and manage records for their jobs
CREATE POLICY "Contractors can manage daily records for their jobs"
ON public.worker_daily_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workforce_jobs wj
    WHERE wj.id = worker_daily_records.job_id
    AND wj.created_by = auth.uid()
  )
);

-- Government can view all records
CREATE POLICY "Government can view all daily records"
ON public.worker_daily_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- RLS for worker_payments
-- Workers can view their own payments
CREATE POLICY "Workers can view their own payments"
ON public.worker_payments
FOR SELECT
USING (auth.uid() = worker_id);

-- Contractors can manage payments for their jobs
CREATE POLICY "Contractors can manage payments for their jobs"
ON public.worker_payments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workforce_jobs wj
    WHERE wj.id = worker_payments.job_id
    AND wj.created_by = auth.uid()
  )
);

-- Government can view all payments
CREATE POLICY "Government can view all payments"
ON public.worker_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'government'
  )
);

-- Add started_at and completed_at to job_applications for tracking work periods
ALTER TABLE public.job_applications 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_days_worked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earned NUMERIC(10,2) DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_worker_daily_records_worker ON public.worker_daily_records(worker_id);
CREATE INDEX idx_worker_daily_records_job ON public.worker_daily_records(job_id);
CREATE INDEX idx_worker_daily_records_date ON public.worker_daily_records(work_date);
CREATE INDEX idx_worker_payments_worker ON public.worker_payments(worker_id);
CREATE INDEX idx_worker_payments_status ON public.worker_payments(payment_status);

-- Create trigger for updated_at
CREATE TRIGGER update_worker_daily_records_updated_at
BEFORE UPDATE ON public.worker_daily_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();