-- Security Hardening: Make audit logs and approval records immutable
-- This prevents tampering with audit trails

-- 1. Make project_approval_audit immutable (no UPDATE/DELETE)
-- First drop any existing policies that might allow modification
DROP POLICY IF EXISTS "No updates to approval audit" ON project_approval_audit;
DROP POLICY IF EXISTS "No deletes from approval audit" ON project_approval_audit;

-- Create explicit deny policies for UPDATE and DELETE
CREATE POLICY "No updates to approval audit"
ON project_approval_audit FOR UPDATE
USING (false);

CREATE POLICY "No deletes from approval audit"
ON project_approval_audit FOR DELETE
USING (false);

-- 2. Make audit_logs also immutable (no UPDATE/DELETE) - government can still only SELECT
DROP POLICY IF EXISTS "No updates to audit logs" ON audit_logs;
DROP POLICY IF EXISTS "No deletes from audit logs" ON audit_logs;

CREATE POLICY "No updates to audit logs"
ON audit_logs FOR UPDATE
USING (false);

CREATE POLICY "No deletes from audit logs"
ON audit_logs FOR DELETE
USING (false);

-- 3. Create a secure view for contractor_profiles that hides sensitive fields from public
-- Public can only see company names, specializations, ratings - not KRA PINs or registration numbers
CREATE OR REPLACE VIEW public.contractor_profiles_public AS
SELECT 
  id,
  user_id,
  company_name,
  specialization,
  years_in_business,
  number_of_employees,
  average_rating,
  previous_projects_count,
  total_contract_value,
  verified,
  verification_date,
  is_agpo,
  agpo_verified,
  agpo_category,
  registered_counties,
  max_project_capacity,
  created_at,
  updated_at
  -- Deliberately EXCLUDED: kra_pin, company_registration_number, tax_compliance_certificate_url
FROM contractor_profiles
WHERE verified = true;

-- Grant access to the public view
GRANT SELECT ON public.contractor_profiles_public TO authenticated;
GRANT SELECT ON public.contractor_profiles_public TO anon;

COMMENT ON VIEW public.contractor_profiles_public IS 'Public-facing contractor profiles with sensitive financial data (KRA PIN, registration numbers) excluded for security';