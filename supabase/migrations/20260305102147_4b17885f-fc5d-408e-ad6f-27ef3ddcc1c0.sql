-- Allow contractors to view user_profiles of applicants who applied to their jobs
CREATE POLICY "Job creators can view applicant profiles"
ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM job_applications ja
    JOIN workforce_jobs wj ON wj.id = ja.job_id
    WHERE ja.applicant_id = user_profiles.user_id
      AND wj.created_by = auth.uid()
  )
);

-- Allow contractors (even unverified) to view citizen_workers of applicants who applied to their jobs
CREATE POLICY "Job creators view applicant worker profiles"
ON public.citizen_workers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM job_applications ja
    JOIN workforce_jobs wj ON wj.id = ja.job_id
    WHERE ja.applicant_id = citizen_workers.user_id
      AND wj.created_by = auth.uid()
  )
);