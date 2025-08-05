-- Create comprehensive database schema for end-to-end workflow

-- Add missing columns to problem_reports for workflow
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS coordinates text;
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS estimated_cost numeric;
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS affected_population integer;
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS photo_urls text[];
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 0;
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE public.problem_reports ADD COLUMN IF NOT EXISTS budget_allocated numeric;

-- Community voting system
CREATE TABLE IF NOT EXISTS public.community_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.problem_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, user_id)
);

-- Contractor bids
CREATE TABLE IF NOT EXISTS public.contractor_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.problem_reports(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bid_amount numeric NOT NULL,
  proposal text NOT NULL,
  estimated_duration integer NOT NULL, -- days
  technical_approach text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'selected', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  selected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Project milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_completion_date timestamptz,
  completion_criteria text,
  payment_percentage numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'verified', 'paid')),
  evidence_urls text[],
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Milestone verifications by citizens
CREATE TABLE IF NOT EXISTS public.milestone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_status text NOT NULL CHECK (verification_status IN ('approved', 'rejected', 'needs_clarification')),
  verification_notes text,
  verification_photos text[],
  verified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(milestone_id, verifier_id)
);

-- Escrow accounts for project payments
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL,
  held_amount numeric NOT NULL DEFAULT 0,
  released_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'cancelled')),
  stripe_account_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_account_id uuid NOT NULL REFERENCES public.escrow_accounts(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.project_milestones(id),
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'release', 'refund')),
  payment_method text DEFAULT 'bank_transfer',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Contractor credentials and verification
CREATE TABLE IF NOT EXISTS public.contractor_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_type text NOT NULL CHECK (credential_type IN ('certification', 'license', 'insurance', 'bond')),
  credential_name text NOT NULL,
  issuing_authority text NOT NULL,
  credential_number text,
  issue_date date,
  expiry_date date,
  document_url text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Skills registration for citizens
CREATE TABLE IF NOT EXISTS public.skills_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text,
  location text,
  organization text,
  years_experience integer,
  certifications text,
  portfolio text,
  available_for_work boolean DEFAULT true,
  skills text[] NOT NULL,
  custom_skills text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category text NOT NULL CHECK (category IN ('report', 'project', 'payment', 'verification', 'system')),
  read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- File uploads tracking
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.problem_reports(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_votes
CREATE POLICY "Anyone can view votes" ON public.community_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote on reports" ON public.community_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their votes" ON public.community_votes FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for contractor_bids
CREATE POLICY "Anyone can view bids" ON public.contractor_bids FOR SELECT USING (true);
CREATE POLICY "Contractors can submit bids" ON public.contractor_bids FOR INSERT WITH CHECK (
  auth.uid() = contractor_id AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'contractor')
);
CREATE POLICY "Contractors can update their bids" ON public.contractor_bids FOR UPDATE USING (auth.uid() = contractor_id);

-- RLS Policies for project_milestones
CREATE POLICY "Anyone can view milestones" ON public.project_milestones FOR SELECT USING (true);
CREATE POLICY "Government can create milestones" ON public.project_milestones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government')
);
CREATE POLICY "Government can update milestones" ON public.project_milestones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government')
);

-- RLS Policies for milestone_verifications
CREATE POLICY "Anyone can view verifications" ON public.milestone_verifications FOR SELECT USING (true);
CREATE POLICY "Citizens can verify milestones" ON public.milestone_verifications FOR INSERT WITH CHECK (
  auth.uid() = verifier_id AND 
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'citizen')
);

-- RLS Policies for escrow_accounts
CREATE POLICY "Anyone can view escrow accounts" ON public.escrow_accounts FOR SELECT USING (true);
CREATE POLICY "Government can manage escrow" ON public.escrow_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government')
);

-- RLS Policies for payment_transactions
CREATE POLICY "Anyone can view payment transactions" ON public.payment_transactions FOR SELECT USING (true);
CREATE POLICY "Government can manage payments" ON public.payment_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government')
);

-- RLS Policies for contractor_credentials
CREATE POLICY "Anyone can view verified credentials" ON public.contractor_credentials FOR SELECT USING (verification_status = 'verified');
CREATE POLICY "Contractors can manage their credentials" ON public.contractor_credentials FOR ALL USING (auth.uid() = contractor_id);
CREATE POLICY "Government can verify credentials" ON public.contractor_credentials FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_type = 'government')
);

-- RLS Policies for skills_profiles
CREATE POLICY "Anyone can view skills profiles" ON public.skills_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their skills" ON public.skills_profiles FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for file_uploads
CREATE POLICY "Anyone can view file uploads" ON public.file_uploads FOR SELECT USING (true);
CREATE POLICY "Users can upload files" ON public.file_uploads FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Function to update priority scores based on votes
CREATE OR REPLACE FUNCTION update_priority_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.problem_reports 
  SET priority_score = (
    SELECT COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE -1 END), 0)
    FROM public.community_votes 
    WHERE report_id = COALESCE(NEW.report_id, OLD.report_id)
  )
  WHERE id = COALESCE(NEW.report_id, OLD.report_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update priority scores
CREATE TRIGGER update_priority_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.community_votes
  FOR EACH ROW EXECUTE FUNCTION update_priority_score();

-- Function to create project from approved report
CREATE OR REPLACE FUNCTION create_project_from_report()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.projects (
      report_id,
      title,
      description,
      budget,
      status
    ) VALUES (
      NEW.id,
      NEW.title,
      NEW.description,
      NEW.budget_allocated,
      'planning'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create projects from approved reports
CREATE TRIGGER create_project_trigger
  AFTER UPDATE ON public.problem_reports
  FOR EACH ROW EXECUTE FUNCTION create_project_from_report();