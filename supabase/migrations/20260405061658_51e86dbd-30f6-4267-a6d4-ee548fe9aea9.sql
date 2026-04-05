
-- Create storage bucket for citizen worker documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('citizen-documents', 'citizen-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Citizens can upload to their own folder
CREATE POLICY "Citizens upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'citizen-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can view citizen documents
CREATE POLICY "Authenticated view citizen documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'citizen-documents' 
  AND auth.role() = 'authenticated'
);

-- Citizens can delete their own documents
CREATE POLICY "Citizens delete own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'citizen-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
