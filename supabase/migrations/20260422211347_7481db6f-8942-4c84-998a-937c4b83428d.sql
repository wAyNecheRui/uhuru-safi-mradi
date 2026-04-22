
-- Add 'auditor' to app_role enum (must be in its own transaction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'auditor' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'auditor';
  END IF;
END $$;
