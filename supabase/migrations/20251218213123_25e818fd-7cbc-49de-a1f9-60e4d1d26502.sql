-- Allow citizens to delete their own reports (only pending ones for safety)
CREATE POLICY "Users can delete own pending reports" 
ON public.problem_reports 
FOR DELETE 
USING (auth.uid() = reported_by AND status = 'pending');