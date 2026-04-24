-- Recreate the public contractor view with security_invoker so it respects
-- the querying user's RLS, not the view creator's.
DROP VIEW IF EXISTS public.contractor_profiles_public;

CREATE VIEW public.contractor_profiles_public
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  company_name,
  agpo_category,
  agpo_verified,
  average_rating,
  created_at,
  is_agpo,
  max_project_capacity,
  number_of_employees,
  previous_projects_count,
  specialization,
  total_contract_value,
  updated_at,
  verification_date,
  verified,
  years_in_business
FROM public.contractor_profiles;