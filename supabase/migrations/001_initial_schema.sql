
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('citizen', 'contractor', 'government')),
    organization TEXT,
    skills TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Problem reports table
CREATE TABLE public.problem_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    location TEXT NOT NULL,
    coordinates TEXT,
    estimated_cost DECIMAL,
    affected_population INTEGER,
    status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'under_review', 'approved', 'in_progress', 'completed', 'rejected')),
    reported_by UUID REFERENCES public.user_profiles(id),
    assigned_contractor UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (approved reports become projects)
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.problem_reports(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL NOT NULL,
    contractor_id UUID REFERENCES public.user_profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contractor bids table
CREATE TABLE public.contractor_bids (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.problem_reports(id),
    contractor_id UUID REFERENCES public.user_profiles(id),
    bid_amount DECIMAL NOT NULL,
    proposal TEXT NOT NULL,
    estimated_duration INTEGER, -- in days
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community votes table
CREATE TABLE public.community_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.problem_reports(id),
    user_id UUID REFERENCES public.user_profiles(id),
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- File uploads table
CREATE TABLE public.file_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id UUID REFERENCES public.problem_reports(id),
    project_id UUID REFERENCES public.projects(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
    category TEXT NOT NULL CHECK (category IN ('project', 'payment', 'report', 'general')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_problem_reports_status ON public.problem_reports(status);
CREATE INDEX idx_problem_reports_category ON public.problem_reports(category);
CREATE INDEX idx_problem_reports_reported_by ON public.problem_reports(reported_by);
CREATE INDEX idx_projects_contractor_id ON public.projects(contractor_id);
CREATE INDEX idx_contractor_bids_report_id ON public.contractor_bids(report_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for problem_reports
CREATE POLICY "Anyone can view problem reports" ON public.problem_reports
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON public.problem_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own reports" ON public.problem_reports
    FOR UPDATE USING (auth.uid() = reported_by);

-- RLS Policies for projects
CREATE POLICY "Anyone can view projects" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Government users can manage projects" ON public.projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'government'
        )
    );

-- RLS Policies for contractor_bids
CREATE POLICY "Anyone can view bids" ON public.contractor_bids
    FOR SELECT USING (true);

CREATE POLICY "Contractors can create bids" ON public.contractor_bids
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'contractor'
        )
    );

CREATE POLICY "Contractors can update own bids" ON public.contractor_bids
    FOR UPDATE USING (auth.uid() = contractor_id);

-- RLS Policies for community_votes
CREATE POLICY "Anyone can view votes" ON public.community_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own votes" ON public.community_votes
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for file_uploads
CREATE POLICY "Anyone can view file uploads" ON public.file_uploads
    FOR SELECT USING (true);

CREATE POLICY "Users can upload files" ON public.file_uploads
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);
