-- Add RLS policy for government to view all contractor profiles
CREATE POLICY "Government can view all contractor profiles directly" 
ON public.contractor_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.user_type = 'government'
  )
);

-- Add RLS policy for government to view all contractor credentials
CREATE POLICY "Government can view all contractor credentials" 
ON public.contractor_credentials 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.user_type = 'government'
  )
);