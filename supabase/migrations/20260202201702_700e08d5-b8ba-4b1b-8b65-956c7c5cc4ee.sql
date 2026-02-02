-- Fix Security Definer View issue by recreating with security_invoker=on
DROP VIEW IF EXISTS public.contractor_profiles_public;

CREATE VIEW public.contractor_profiles_public
WITH (security_invoker=on) AS
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

COMMENT ON VIEW public.contractor_profiles_public IS 'Public-facing contractor profiles with sensitive financial data (KRA PIN, registration numbers) excluded for security. Uses security_invoker for proper RLS enforcement.';