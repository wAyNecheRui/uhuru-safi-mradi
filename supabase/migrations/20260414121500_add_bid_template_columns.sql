-- Migration: Add extended bid proposal columns to contractor_bids
-- These match the expanded bid form fields aligned with official sector templates.
-- Required: materials_spec, timeline_breakdown, safety_plan, quality_assurance
-- Note: technical_approach already exists from the initial schema (migration 20250805075853)

ALTER TABLE public.contractor_bids
  ADD COLUMN IF NOT EXISTS materials_spec TEXT,
  ADD COLUMN IF NOT EXISTS timeline_breakdown TEXT,
  ADD COLUMN IF NOT EXISTS safety_plan TEXT,
  ADD COLUMN IF NOT EXISTS quality_assurance TEXT;

-- Add a check so we can also widen the accepted field from credential_types
-- that was narrowly defined in an older version of contractor_credentials
ALTER TABLE public.contractor_credentials
  DROP CONSTRAINT IF EXISTS contractor_credentials_credential_type_check;

ALTER TABLE public.contractor_credentials
  ADD CONSTRAINT contractor_credentials_credential_type_check
    CHECK (credential_type IN (
      'certification', 'license', 'insurance', 'bond',
      'nca_license', 'kra_compliance', 'eacc_clearance',
      'business_permit', 'professional_registration', 'other'
    ));
