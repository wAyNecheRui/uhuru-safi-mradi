
-- Fix problem_reports policies that reference user_profiles directly
DROP POLICY IF EXISTS "Reporter can update own problem or government" ON public.problem_reports;
CREATE POLICY "Reporter can update own problem or government" ON public.problem_reports
FOR UPDATE USING (
  ((auth.uid() = reported_by) AND (status = 'pending'))
  OR public.get_user_type(auth.uid()) = 'government'
);

DROP POLICY IF EXISTS "Delete by reporter or government" ON public.problem_reports;
CREATE POLICY "Delete by reporter or government" ON public.problem_reports
FOR DELETE USING (
  ((auth.uid() = reported_by) AND (status = 'pending'))
  OR public.get_user_type(auth.uid()) = 'government'
);

DROP POLICY IF EXISTS "Government can view all reports including deleted" ON public.problem_reports;
CREATE POLICY "Government can view all reports including deleted" ON public.problem_reports
FOR SELECT USING (
  public.get_user_type(auth.uid()) = 'government'
);
