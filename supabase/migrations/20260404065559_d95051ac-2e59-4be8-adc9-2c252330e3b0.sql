
-- Create storage bucket for contractor credential documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('contractor-documents', 'contractor-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow contractors to upload to their own folder
CREATE POLICY "Contractors upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contractor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone authenticated to read documents
CREATE POLICY "Authenticated users view contractor documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'contractor-documents'
  AND auth.uid() IS NOT NULL
);

-- Allow contractors to update/replace their own documents
CREATE POLICY "Contractors update own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'contractor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow contractors to delete their own documents
CREATE POLICY "Contractors delete own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'contractor-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
