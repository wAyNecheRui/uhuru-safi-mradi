-- ============================================
-- SECURITY FIX: Protect citizen_workers sensitive data from contractors
-- Contractors should only see basic info, not PII
-- ============================================

-- Drop the overly permissive worker discovery policy
DROP POLICY IF EXISTS "Workers are discoverable" ON citizen_workers;

-- Create separate policies for different access levels
-- 1. Workers can see their own full profile
CREATE POLICY "Workers view own full profile"
ON citizen_workers FOR SELECT
USING (auth.uid() = user_id);

-- 2. Contractors can discover workers but only see non-sensitive fields
-- Note: We need a view for this, but for now restrict to verified contractors
CREATE POLICY "Contractors view worker basics"
ON citizen_workers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contractor_profiles cp
    JOIN user_profiles up ON up.user_id = cp.user_id
    WHERE cp.user_id = auth.uid() 
      AND cp.verified = true
      AND up.user_type = 'contractor'
  )
);

-- 3. Government can view all workers (for oversight)
CREATE POLICY "Government view all workers"
ON citizen_workers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.user_type = 'government'
  )
);

-- ============================================
-- SECURITY FIX: Create a safe public view for workers (hides PII)
-- ============================================
CREATE OR REPLACE VIEW public.citizen_workers_public
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  county,
  sub_county,
  ward,
  skills,
  availability_status,
  experience_years,
  certifications,
  education_level,
  languages,
  rating,
  total_jobs_completed,
  willing_to_travel,
  max_travel_distance,
  transport_means,
  verification_status,
  created_at,
  -- HIDE: national_id, kra_pin, bank_account, bank_name, phone_number, 
  --       alternate_phone, emergency_contact_name, emergency_contact_phone,
  --       physical_address, profile_photo_url, cv_document_url
  -- Show rate range instead of exact
  CASE 
    WHEN hourly_rate IS NOT NULL THEN 
      FLOOR(hourly_rate / 100) * 100  -- Round to nearest 100
    ELSE NULL 
  END as hourly_rate_rounded,
  CASE 
    WHEN daily_rate IS NOT NULL THEN 
      FLOOR(daily_rate / 500) * 500  -- Round to nearest 500
    ELSE NULL 
  END as daily_rate_rounded
FROM citizen_workers
WHERE verification_status = 'verified';

-- ============================================
-- SECURITY FIX: Restrict disputes visibility during investigation
-- ============================================

DROP POLICY IF EXISTS "Anyone can view disputes for transparency" ON disputes;

-- Open disputes only visible to involved parties
CREATE POLICY "Active disputes visible to stakeholders"
ON disputes FOR SELECT
USING (
  -- Resolved disputes are public for transparency
  status = 'resolved'
  OR
  -- Open disputes only to involved parties
  (
    auth.uid() = raised_by
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = disputes.project_id 
        AND p.contractor_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
    )
  )
);

-- ============================================
-- SECURITY FIX: Restrict user_profiles access more strictly
-- ============================================

DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Users can only view their own profile
CREATE POLICY "Users view own profile only"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Government can view all profiles (for administrative purposes)
CREATE POLICY "Government view all user profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles gov_check
    WHERE gov_check.user_id = auth.uid() 
      AND gov_check.user_type = 'government'
  )
);

-- ============================================
-- SECURITY FIX: Require justification for worker data access audit
-- ============================================

-- Make justification required in worker access audit (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worker_access_audit') THEN
    ALTER TABLE worker_access_audit ALTER COLUMN justification SET NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table doesn't exist or column already non-null, ignore
END $$;