-- Harden report-files bucket policies. Bucket stays public for read.
-- Drop the overly permissive legacy policy that let any authenticated user
-- upload into any folder.
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own report files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload report files to own folder" ON storage.objects;

-- Keep public read (existing "Anyone can view files" policy stays in place).

-- Owner-folder INSERT: file path must start with auth.uid()/...
CREATE POLICY "Users can upload report files to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-files'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Owner-folder UPDATE: only own files
CREATE POLICY "Users can update own report files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'report-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'report-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Existing "Users can delete own files" already enforces folder ownership; leave as-is.