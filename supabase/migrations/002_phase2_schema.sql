
-- Phase 2: Core System Implementation Database Schema

-- Escrow Accounts Table
CREATE TABLE public.escrow_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    total_amount DECIMAL NOT NULL,
    held_amount DECIMAL DEFAULT 0,
    released_amount DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Milestones Table
CREATE TABLE public.project_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escrow_account_id UUID REFERENCES public.escrow_accounts(id) NOT NULL,
    milestone_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    completion_criteria TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'verified', 'paid')),
    completed_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Transactions Table
CREATE TABLE public.payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    escrow_account_id UUID REFERENCES public.escrow_accounts(id) NOT NULL,
    milestone_id UUID REFERENCES public.project_milestones(id),
    amount DECIMAL NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'release', 'refund')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'bank_transfer', 'card')),
    mpesa_transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Contracts Table
CREATE TABLE public.smart_contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    contract_address TEXT NOT NULL,
    contract_type TEXT NOT NULL CHECK (contract_type IN ('escrow', 'milestone', 'verification')),
    abi TEXT NOT NULL,
    deployment_hash TEXT NOT NULL,
    status TEXT DEFAULT 'deployed' CHECK (status IN ('deployed', 'verified', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain Transactions Table
CREATE TABLE public.blockchain_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('project_creation', 'milestone_completion', 'payment_release', 'dispute_resolution')),
    data_hash TEXT NOT NULL,
    smart_contract_address TEXT,
    gas_used BIGINT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Project Blockchain Records Table
CREATE TABLE public.project_blockchain_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('creation', 'milestone', 'completion', 'payment', 'dispute')),
    data_hash TEXT NOT NULL,
    ipfs_hash TEXT,
    blockchain_hash TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification Records Table
CREATE TABLE public.verification_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('kra_pin', 'eacc_clearance', 'professional_credentials', 'company_registration')),
    reference_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
    verification_data JSONB,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_escrow_accounts_project_id ON public.escrow_accounts(project_id);
CREATE INDEX idx_project_milestones_escrow_account_id ON public.project_milestones(escrow_account_id);
CREATE INDEX idx_payment_transactions_escrow_account_id ON public.payment_transactions(escrow_account_id);
CREATE INDEX idx_smart_contracts_project_id ON public.smart_contracts(project_id);
CREATE INDEX idx_blockchain_transactions_project_id ON public.blockchain_transactions(project_id);
CREATE INDEX idx_blockchain_transactions_hash ON public.blockchain_transactions(transaction_hash);
CREATE INDEX idx_verification_records_user_id ON public.verification_records(user_id);
CREATE INDEX idx_verification_records_type ON public.verification_records(verification_type);

-- Enable Row Level Security
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_blockchain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escrow_accounts
CREATE POLICY "Users can view escrow accounts for their projects" ON public.escrow_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND (
                p.contractor_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.problem_reports pr
                    WHERE pr.id = p.report_id AND pr.reported_by = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM public.user_profiles up
                    WHERE up.id = auth.uid() AND up.user_type = 'government'
                )
            )
        )
    );

-- RLS Policies for verification_records
CREATE POLICY "Users can view own verification records" ON public.verification_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification records" ON public.verification_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Government users can view all verification records" ON public.verification_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND user_type = 'government'
        )
    );

-- RLS Policies for blockchain records (readable by all for transparency)
CREATE POLICY "Anyone can view blockchain records" ON public.blockchain_transactions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view project blockchain records" ON public.project_blockchain_records
    FOR SELECT USING (true);
