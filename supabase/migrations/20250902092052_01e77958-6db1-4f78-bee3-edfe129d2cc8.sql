-- Add missing columns and tables for comprehensive implementation

-- Add GPS and multimedia support to problem_reports
ALTER TABLE public.problem_reports 
ADD COLUMN IF NOT EXISTS gps_coordinates POINT,
ADD COLUMN IF NOT EXISTS video_urls TEXT[],
ADD COLUMN IF NOT EXISTS verification_deadline TIMESTAMP WITH TIME ZONE;

-- Create contractor performance ratings table
CREATE TABLE IF NOT EXISTS public.contractor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  rated_by UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  completion_timeliness INTEGER CHECK (completion_timeliness >= 1 AND completion_timeliness <= 5),
  work_quality INTEGER CHECK (work_quality >= 1 AND work_quality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blockchain transaction records
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT UNIQUE NOT NULL,
  block_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  amount NUMERIC NOT NULL,
  gas_used BIGINT,
  network_status TEXT DEFAULT 'pending',
  signatures JSONB DEFAULT '[]',
  verification_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create local purchase orders table
CREATE TABLE IF NOT EXISTS public.local_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lpo_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  contractor_id UUID NOT NULL,
  issued_by UUID NOT NULL,
  total_amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  terms_conditions TEXT,
  status TEXT DEFAULT 'issued',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME zone DEFAULT now()
);

-- Create citizen worker registry
CREATE TABLE IF NOT EXISTS public.citizen_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  national_id TEXT,
  kra_pin TEXT,
  phone_number TEXT NOT NULL,
  alternate_phone TEXT,
  physical_address TEXT,
  county TEXT NOT NULL,
  sub_county TEXT,
  ward TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bank_name TEXT,
  bank_account TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  education_level TEXT,
  certifications TEXT[],
  languages TEXT[] DEFAULT '{"English", "Swahili"}',
  availability_status TEXT DEFAULT 'available',
  hourly_rate NUMERIC,
  daily_rate NUMERIC,
  transport_means TEXT[],
  willing_to_travel BOOLEAN DEFAULT false,
  max_travel_distance INTEGER,
  verification_status TEXT DEFAULT 'pending',
  background_check_status TEXT DEFAULT 'pending',
  rating NUMERIC DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  profile_photo_url TEXT,
  cv_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job applications tracking
CREATE TABLE IF NOT EXISTS public.workforce_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.workforce_jobs(id) NOT NULL,
  worker_id UUID REFERENCES public.citizen_workers(id) NOT NULL,
  application_letter TEXT,
  proposed_rate NUMERIC,
  availability_start DATE,
  availability_end DATE,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  UNIQUE(job_id, worker_id)
);

-- Create project progress tracking
CREATE TABLE IF NOT EXISTS public.project_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  milestone_id UUID REFERENCES public.project_milestones(id),
  progress_percentage NUMERIC CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  update_description TEXT NOT NULL,
  photo_urls TEXT[],
  video_urls TEXT[],
  gps_coordinates POINT,
  weather_conditions TEXT,
  workers_present INTEGER,
  equipment_used TEXT[],
  challenges_faced TEXT,
  updated_by UUID NOT NULL,
  supervisor_approved BOOLEAN DEFAULT false,
  citizen_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quality assurance checkpoints
CREATE TABLE IF NOT EXISTS public.quality_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  milestone_id UUID REFERENCES public.project_milestones(id),
  checkpoint_name TEXT NOT NULL,
  inspection_criteria TEXT NOT NULL,
  inspector_type TEXT NOT NULL, -- 'government', 'citizen', 'engineer'
  inspector_id UUID NOT NULL,
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  passed BOOLEAN,
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  findings TEXT,
  recommendations TEXT,
  corrective_actions TEXT,
  photo_evidence TEXT[],
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.contractor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_ratings
CREATE POLICY "Anyone can view contractor ratings" ON public.contractor_ratings FOR SELECT USING (true);
CREATE POLICY "Project stakeholders can rate contractors" ON public.contractor_ratings FOR INSERT 
WITH CHECK ((EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND (p.contractor_id = auth.uid() OR EXISTS (SELECT 1 FROM problem_reports pr WHERE pr.id = p.report_id AND pr.reported_by = auth.uid())))) OR (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government')));

-- RLS Policies for blockchain_transactions
CREATE POLICY "Anyone can view blockchain transactions" ON public.blockchain_transactions FOR SELECT USING (true);
CREATE POLICY "Government can manage blockchain records" ON public.blockchain_transactions FOR ALL 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government'));

-- RLS Policies for local_purchase_orders
CREATE POLICY "Government can manage LPOs" ON public.local_purchase_orders FOR ALL 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government'));
CREATE POLICY "Contractors can view their LPOs" ON public.local_purchase_orders FOR SELECT 
USING (auth.uid() = contractor_id);

-- RLS Policies for citizen_workers
CREATE POLICY "Workers can manage their profiles" ON public.citizen_workers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Government can view worker profiles" ON public.citizen_workers FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government'));
CREATE POLICY "Contractors can view available workers" ON public.citizen_workers FOR SELECT 
USING (availability_status = 'available' AND verification_status = 'verified');

-- RLS Policies for workforce_applications
CREATE POLICY "Workers can manage their applications" ON public.workforce_applications FOR ALL 
USING (EXISTS (SELECT 1 FROM citizen_workers WHERE id = worker_id AND user_id = auth.uid()));
CREATE POLICY "Job creators can view applications" ON public.workforce_applications FOR SELECT 
USING (EXISTS (SELECT 1 FROM workforce_jobs wj WHERE wj.id = job_id AND wj.created_by = auth.uid()));

-- RLS Policies for project_progress
CREATE POLICY "Anyone can view project progress" ON public.project_progress FOR SELECT USING (true);
CREATE POLICY "Project stakeholders can update progress" ON public.project_progress FOR INSERT 
WITH CHECK ((EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.contractor_id = auth.uid())) OR (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government')));

-- RLS Policies for quality_checkpoints
CREATE POLICY "Anyone can view quality checkpoints" ON public.quality_checkpoints FOR SELECT USING (true);
CREATE POLICY "Authorized inspectors can create checkpoints" ON public.quality_checkpoints FOR INSERT 
WITH CHECK (auth.uid() = inspector_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_ratings_contractor_id ON public.contractor_ratings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_project_id ON public.blockchain_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON public.blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_citizen_workers_county ON public.citizen_workers(county);
CREATE INDEX IF NOT EXISTS idx_citizen_workers_skills ON public.citizen_workers USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_project_progress_project_id ON public.project_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_project_id ON public.quality_checkpoints(project_id);

-- Create updated_at trigger for citizen_workers
CREATE TRIGGER update_citizen_workers_updated_at
BEFORE UPDATE ON public.citizen_workers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();