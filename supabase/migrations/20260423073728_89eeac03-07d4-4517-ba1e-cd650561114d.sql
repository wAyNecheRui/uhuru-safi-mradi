
DROP POLICY IF EXISTS "Citizens view own documents" ON storage.objects;
CREATE POLICY "Citizens view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'citizen-documents'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.is_verified_government_user(auth.uid())
  )
);

UPDATE storage.buckets SET public = false WHERE id = 'contractor-documents';

DROP POLICY IF EXISTS "Contractor documents restricted view" ON storage.objects;
CREATE POLICY "Contractor documents restricted view"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contractor-documents'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.is_verified_government_user(auth.uid())
  )
);
