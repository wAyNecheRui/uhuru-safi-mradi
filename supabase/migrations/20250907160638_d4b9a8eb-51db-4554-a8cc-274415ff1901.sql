-- Fix critical security issue: Worker Personal Information Protection
-- Remove problematic block_unauthorized_access policy and implement secure access controls

-- Drop the problematic policy that blocks all access
DROP POLICY IF EXISTS "block_unauthorized_access" ON public.citizen_workers;

-- Create new secure policies for citizen_workers table
CREATE POLICY "workers_can_manage_own_profile" 
ON public.citizen_workers 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "verified_government_can_read_workers" 
ON public.citizen_workers 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
);

CREATE POLICY "verified_government_can_update_verification_status" 
ON public.citizen_workers 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
);

-- Create audit table for worker data access
CREATE TABLE public.worker_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  government_user_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'update', 'export'
  accessed_fields text[],
  justification text,
  ip_address inet,
  user_agent text,
  session_id text,
  access_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.worker_access_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table
CREATE POLICY "verified_government_can_log_access" 
ON public.worker_access_audit 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = government_user_id AND
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
);

CREATE POLICY "government_can_view_own_access_logs" 
ON public.worker_access_audit 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = government_user_id AND
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  )
);

-- Create function to automatically log worker data access
CREATE OR REPLACE FUNCTION public.log_worker_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log government access, not worker's own access
  IF EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.user_type = 'government'
    AND auth.uid() != COALESCE(NEW.user_id, OLD.user_id)
  ) THEN
    INSERT INTO public.worker_access_audit (
      government_user_id,
      worker_id,
      access_type,
      accessed_fields,
      justification
    ) VALUES (
      auth.uid(),
      COALESCE(NEW.user_id, OLD.user_id),
      CASE 
        WHEN TG_OP = 'SELECT' THEN 'view'
        WHEN TG_OP = 'UPDATE' THEN 'update'
        ELSE lower(TG_OP)
      END,
      CASE 
        WHEN TG_OP = 'UPDATE' THEN ARRAY(
          SELECT key FROM jsonb_each_text(to_jsonb(NEW)) 
          WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key
        )
        ELSE NULL
      END,
      'Automated access log'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for audit logging
CREATE TRIGGER audit_worker_data_access
  AFTER UPDATE OR DELETE ON public.citizen_workers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_worker_data_access();

-- Fix payment transaction security
-- Simplify RLS policies for payment_transactions
DROP POLICY IF EXISTS "Government and transaction parties can view payments" ON public.payment_transactions;

CREATE POLICY "government_can_view_all_payments" 
ON public.payment_transactions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND user_type = 'government'
  )
);

CREATE POLICY "project_stakeholders_can_view_payments" 
ON public.payment_transactions 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM escrow_accounts ea
    JOIN projects p ON p.id = ea.project_id
    WHERE ea.id = payment_transactions.escrow_account_id
    AND (
      p.contractor_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM problem_reports pr
        WHERE pr.id = p.report_id AND pr.reported_by = auth.uid()
      )
    )
  )
);

-- Encrypt sensitive payment metadata
CREATE OR REPLACE FUNCTION public.encrypt_payment_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt stripe_transaction_id if present
  IF NEW.stripe_transaction_id IS NOT NULL AND NEW.stripe_transaction_id != '' THEN
    NEW.stripe_transaction_id = public.encrypt_sensitive_data(NEW.stripe_transaction_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment data encryption
CREATE TRIGGER encrypt_payment_sensitive_data
  BEFORE INSERT OR UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_payment_metadata();

-- Add updated_at trigger to audit table
CREATE TRIGGER update_worker_access_audit_updated_at
  BEFORE UPDATE ON public.worker_access_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();