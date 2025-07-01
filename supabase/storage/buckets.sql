
-- Create storage bucket for report files
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-files', 'report-files', true);

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'report-files' AND auth.role() = 'authenticated');

-- Create policy to allow anyone to view files
CREATE POLICY "Anyone can view files" ON storage.objects
    FOR SELECT USING (bucket_id = 'report-files');

-- Create policy to allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'report-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
