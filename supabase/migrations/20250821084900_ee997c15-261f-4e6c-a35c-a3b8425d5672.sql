-- Create storage bucket for report files
INSERT INTO storage.buckets (id, name, public) VALUES ('report-files', 'report-files', true);

-- Create storage policies for report files
CREATE POLICY "Anyone can view report files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'report-files');

CREATE POLICY "Authenticated users can upload report files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'report-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own report files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'report-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for community_votes table
ALTER TABLE community_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE community_votes;

-- Enable realtime for problem_reports table
ALTER TABLE problem_reports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE problem_reports;