-- =============================================
-- FIX STORAGE POLICIES: Enforce folder ownership
-- =============================================

-- Drop existing storage policies to recreate with proper restrictions
DROP POLICY IF EXISTS "Authenticated users can upload report files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view report files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own report files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- CREATE: Enforce folder ownership on upload
CREATE POLICY "Users upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- READ: Public access to report files
CREATE POLICY "Report files are public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'report-files');

-- UPDATE: Only own files
CREATE POLICY "Users update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'report-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'report-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Only own files (now properly applied)
CREATE POLICY "Users delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- SOFT DELETE: Add deleted_at columns to audit-critical tables
-- =============================================

-- Problem reports (critical audit trail)
ALTER TABLE public.problem_reports 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Projects (financial/contract trail)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Contractor bids (procurement audit)
ALTER TABLE public.contractor_bids
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Payment transactions (financial audit - never hard delete)
ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Escrow accounts (financial audit)
ALTER TABLE public.escrow_accounts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- Create indexes for soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_problem_reports_deleted_at ON public.problem_reports(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_bids_deleted_at ON public.contractor_bids(deleted_at) WHERE deleted_at IS NULL;

-- =============================================
-- UPDATE RLS: Exclude soft-deleted from public views
-- =============================================

-- Problem reports: Update SELECT policy to exclude deleted
DROP POLICY IF EXISTS "Anyone can view reported problems" ON public.problem_reports;
CREATE POLICY "Anyone can view active reports"
ON public.problem_reports
FOR SELECT
USING (deleted_at IS NULL);

-- Government can view ALL including deleted (for audit)
CREATE POLICY "Government can view all reports including deleted"
ON public.problem_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.user_type = 'government'
  )
);

-- Projects: Exclude soft-deleted from public
DROP POLICY IF EXISTS "Projects are publicly visible" ON public.projects;
CREATE POLICY "Anyone can view active projects"
ON public.projects
FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Government can view all projects including deleted"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.user_type = 'government'
  )
);

-- Contractor bids: Exclude soft-deleted
DROP POLICY IF EXISTS "Bid visibility control" ON public.contractor_bids;
CREATE POLICY "Bid visibility for active bids"
ON public.contractor_bids
FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    auth.uid() = contractor_id
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_type = 'government'
    )
  )
);

-- =============================================
-- SOFT DELETE FUNCTION: For safe deletion
-- =============================================

CREATE OR REPLACE FUNCTION public.soft_delete_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = now(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL',
    p_table_name
  ) USING auth.uid(), p_record_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_record TO authenticated;