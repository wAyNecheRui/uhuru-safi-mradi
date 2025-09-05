-- Step 2: Update RLS policies and create audit system

-- Drop the existing less secure government policy
DROP POLICY IF EXISTS "government_read_all_workers" ON public.citizen_workers;

-- Create new stricter policy that requires verified government status
CREATE POLICY "verified_government_read_workers" 
ON public.citizen_workers 
FOR SELECT
TO authenticated
USING (public.is_verified_government_user());

-- Create audit table for tracking government access to worker data
CREATE TABLE IF NOT EXISTS public.worker_data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  government_user_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'contact_access', 'search', 'export'
  accessed_fields text[], -- track which fields were accessed
  access_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  session_id text,
  ip_address inet
);

-- Enable RLS on audit table
ALTER TABLE public.worker_data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only verified government users can insert logs
CREATE POLICY "verified_government_can_log_access" 
ON public.worker_data_access_logs 
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_verified_government_user() 
  AND auth.uid() = government_user_id
);

-- Government users can view their own access logs
CREATE POLICY "government_can_view_own_logs" 
ON public.worker_data_access_logs 
FOR SELECT
TO authenticated
USING (
  public.is_verified_government_user() 
  AND auth.uid() = government_user_id
);

-- Add trigger for updated_at on audit table
CREATE TRIGGER update_worker_data_access_logs_updated_at
  BEFORE UPDATE ON public.worker_data_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add documentation comments
COMMENT ON FUNCTION public.is_verified_government_user() IS 
'Securely verifies if a user is a verified government official with valid, non-expired verification';

COMMENT ON TABLE public.worker_data_access_logs IS 
'Audit log for tracking government user access to sensitive worker data';

COMMENT ON POLICY "verified_government_read_workers" ON public.citizen_workers IS 
'Only allows access to users with verified government status and valid verification records';