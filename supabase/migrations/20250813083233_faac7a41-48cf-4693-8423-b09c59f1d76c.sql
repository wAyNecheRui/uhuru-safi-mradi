-- Create workforce_jobs table for job matching system
CREATE TABLE public.workforce_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL,
  wage_min NUMERIC,
  wage_max NUMERIC,
  duration_days INTEGER,
  positions_available INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'closed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.workforce_jobs(id) NOT NULL,
  applicant_id UUID NOT NULL,
  application_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

-- Create realtime_project_updates table for live updates
CREATE TABLE public.realtime_project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  update_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create system_analytics table for KPI tracking
CREATE TABLE public.system_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  category TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.workforce_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workforce_jobs
CREATE POLICY "Anyone can view open jobs" ON public.workforce_jobs
  FOR SELECT USING (status = 'open');

CREATE POLICY "Government can manage jobs" ON public.workforce_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

CREATE POLICY "Contractors can create jobs for their projects" ON public.workforce_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE p.id = workforce_jobs.project_id 
      AND p.contractor_id = auth.uid()
      AND up.user_type = 'contractor'
    )
  );

-- RLS Policies for job_applications
CREATE POLICY "Applicants can view their applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Job creators and government can view applications" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workforce_jobs wj
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE wj.id = job_applications.job_id 
      AND (wj.created_by = auth.uid() OR up.user_type = 'government')
    )
  );

CREATE POLICY "Citizens can apply for jobs" ON public.job_applications
  FOR INSERT WITH CHECK (
    auth.uid() = applicant_id AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'citizen'
    )
  );

CREATE POLICY "Job creators can update applications" ON public.job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workforce_jobs wj
      WHERE wj.id = job_applications.job_id 
      AND wj.created_by = auth.uid()
    )
  );

-- RLS Policies for realtime_project_updates
CREATE POLICY "Anyone can view project updates" ON public.realtime_project_updates
  FOR SELECT USING (true);

CREATE POLICY "Project stakeholders can create updates" ON public.realtime_project_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN problem_reports pr ON pr.id = p.report_id
      WHERE p.id = realtime_project_updates.project_id 
      AND (p.contractor_id = auth.uid() OR pr.reported_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

-- RLS Policies for system_analytics
CREATE POLICY "Government can view all analytics" ON public.system_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

CREATE POLICY "Government can manage analytics" ON public.system_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'government'
    )
  );

-- Create function to update analytics automatically
CREATE OR REPLACE FUNCTION public.update_system_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert daily metrics
  INSERT INTO public.system_analytics (metric_name, metric_value, metric_date, category)
  VALUES 
    (
      'total_reports',
      (SELECT COUNT(*) FROM problem_reports WHERE DATE(created_at) = CURRENT_DATE),
      CURRENT_DATE,
      'reports'
    ),
    (
      'approved_projects',
      (SELECT COUNT(*) FROM problem_reports WHERE status = 'approved' AND DATE(approved_at) = CURRENT_DATE),
      CURRENT_DATE,
      'projects'
    ),
    (
      'active_contractors',
      (SELECT COUNT(DISTINCT contractor_id) FROM projects WHERE status IN ('in_progress', 'planning')),
      CURRENT_DATE,
      'contractors'
    ),
    (
      'pending_payments',
      (SELECT COUNT(*) FROM payment_transactions WHERE status = 'pending'),
      CURRENT_DATE,
      'payments'
    )
  ON CONFLICT (metric_name, metric_date) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
END;
$$;

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workforce_jobs_updated_at
  BEFORE UPDATE ON public.workforce_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();