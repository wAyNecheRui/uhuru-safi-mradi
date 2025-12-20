-- Create disputes table for dispute resolution system
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  raised_by UUID NOT NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('quality', 'payment', 'timeline', 'scope', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'escalated', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view disputes for transparency"
  ON public.disputes FOR SELECT
  USING (true);

CREATE POLICY "Project stakeholders can raise disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = raised_by AND (
      EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = disputes.project_id 
        AND (p.contractor_id = auth.uid() OR EXISTS (
          SELECT 1 FROM problem_reports pr 
          WHERE pr.id = p.report_id AND pr.reported_by = auth.uid()
        ))
      ) OR 
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
      )
    )
  );

CREATE POLICY "Government can update disputes"
  ON public.disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.user_type = 'government'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();