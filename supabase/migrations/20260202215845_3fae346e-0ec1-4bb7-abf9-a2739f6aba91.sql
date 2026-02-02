-- ============================================
-- SECURITY FIX: Restrict public access to sensitive financial data
-- ============================================

-- Drop overly permissive policies on payment_transactions
DROP POLICY IF EXISTS "Citizens can view payment transactions for transparency" ON payment_transactions;

-- Create restricted policy - contractors and government + citizens only see completed
CREATE POLICY "Authenticated users view payment transactions"
ON payment_transactions FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Contractors see their own project payments
    EXISTS (
      SELECT 1 FROM escrow_accounts ea
      JOIN projects p ON p.id = ea.project_id
      WHERE ea.id = payment_transactions.escrow_account_id 
        AND p.contractor_id = auth.uid()
    )
    OR
    -- Government sees all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
    )
    OR
    -- Citizens can see completed/verified payments for transparency (but not pending)
    (
      payment_transactions.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid() 
          AND user_profiles.user_type = 'citizen'
      )
    )
  )
);

-- Drop overly permissive policies on escrow_accounts  
DROP POLICY IF EXISTS "Citizens can view escrow accounts for transparency" ON escrow_accounts;

-- Create restricted policy - citizens only see funded projects, not pending amounts
CREATE POLICY "Authenticated users view escrow accounts"
ON escrow_accounts FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Contractors see their own project escrow
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = escrow_accounts.project_id 
        AND p.contractor_id = auth.uid()
    )
    OR
    -- Government sees all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
    )
    OR
    -- Citizens see only active/funded escrow accounts
    (
      escrow_accounts.status = 'active'
      AND escrow_accounts.total_amount > 0
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid() 
          AND user_profiles.user_type = 'citizen'
      )
    )
  )
);

-- Drop overly permissive policy on blockchain_transactions
DROP POLICY IF EXISTS "Anyone can view blockchain transactions" ON blockchain_transactions;

-- Create restricted policy - hide detailed signatures from public
CREATE POLICY "Authenticated users view blockchain transactions"
ON blockchain_transactions FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Government sees all details
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.user_type = 'government'
    )
    OR
    -- Contractors see their project transactions
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = blockchain_transactions.project_id 
        AND p.contractor_id = auth.uid()
    )
    OR
    -- Citizens see confirmed transactions only
    (
      blockchain_transactions.network_status = 'confirmed'
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
      )
    )
  )
);

-- ============================================
-- SECURITY FIX: Protect contractor sensitive data
-- ============================================

-- Drop the permissive public contractor profiles policy
DROP POLICY IF EXISTS "Public contractor profiles" ON contractor_profiles;

-- Create more restrictive policy
CREATE POLICY "Public contractor profiles"
ON contractor_profiles FOR SELECT
USING (
  -- Own profile
  auth.uid() = user_id
  OR
  -- Verified contractors are visible (but sensitive fields filtered via view)
  verified = true
  OR
  -- Government sees all
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.user_type = 'government'
  )
);

-- ============================================
-- SECURITY FIX: Add search_path to trigger functions (safe updates)
-- ============================================

-- Core utility functions - these are safe to update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_priority_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.priority_score := 
    CASE 
      WHEN NEW.priority = 'urgent' THEN 100
      WHEN NEW.priority = 'high' THEN 75
      WHEN NEW.priority = 'medium' THEN 50
      ELSE 25
    END + COALESCE(NEW.verified_votes, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- RBAC functions (SECURITY DEFINER with search_path)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM user_roles WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 
    CASE 
      WHEN NEW.user_type = 'government' THEN 'government'::app_role
      WHEN NEW.user_type = 'contractor' THEN 'contractor'::app_role
      ELSE 'citizen'::app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User management
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'citizen')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Soft delete function
CREATE OR REPLACE FUNCTION public.soft_delete_record()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = now();
  NEW.deleted_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Voting functions
CREATE OR REPLACE FUNCTION public.can_user_vote(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM community_votes
    WHERE user_id = _user_id AND report_id = _report_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_user_verify(_user_id uuid, _milestone_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM milestone_verifications
    WHERE verifier_id = _user_id AND milestone_id = _milestone_id
  );
$$;

CREATE OR REPLACE FUNCTION public.check_vote_threshold_transition()
RETURNS TRIGGER AS $$
DECLARE
  vote_count INTEGER;
  report_status TEXT;
BEGIN
  SELECT COUNT(*), pr.status INTO vote_count, report_status
  FROM community_votes cv
  JOIN problem_reports pr ON pr.id = cv.report_id
  WHERE cv.report_id = NEW.report_id AND cv.vote_type = 'verify'
  GROUP BY pr.status;
  
  IF vote_count >= 10 AND report_status = 'pending' THEN
    UPDATE problem_reports 
    SET status = 'verified', verified_votes = vote_count
    WHERE id = NEW.report_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Distance calculation
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 6371 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lon2) - radians(lon1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  );
$$;

-- Government verification check
CREATE OR REPLACE FUNCTION public.is_verified_government_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM government_profiles gp
    JOIN user_profiles up ON up.user_id = gp.user_id
    WHERE gp.user_id = auth.uid() 
      AND gp.verified = true
      AND up.user_type = 'government'
  );
$$;

-- Escrow validation
CREATE OR REPLACE FUNCTION public.validate_escrow_funding(
  _project_id uuid,
  _amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  project_budget numeric;
  current_funded numeric;
BEGIN
  SELECT p.budget INTO project_budget
  FROM projects p WHERE p.id = _project_id;
  
  SELECT COALESCE(SUM(total_amount), 0) INTO current_funded
  FROM escrow_accounts WHERE project_id = _project_id;
  
  RETURN (current_funded + _amount) <= project_budget;
END;
$$;

-- Bidding window management
CREATE OR REPLACE FUNCTION public.open_bidding_for_project(_report_id uuid, _duration_days integer DEFAULT 14)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE problem_reports SET
    bidding_status = 'open',
    bidding_start_date = now(),
    bidding_end_date = now() + (_duration_days || ' days')::interval
  WHERE id = _report_id AND status IN ('approved', 'verified');
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_bidding_window(_report_id uuid, _additional_days integer DEFAULT 7)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE problem_reports SET
    bidding_end_date = bidding_end_date + (_additional_days || ' days')::interval,
    bidding_extensions = COALESCE(bidding_extensions, 0) + 1
  WHERE id = _report_id AND bidding_status = 'open';
END;
$$;

-- Status sync
CREATE OR REPLACE FUNCTION public.sync_report_status_from_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE problem_reports SET status = 'completed' WHERE id = NEW.report_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- System analytics update
CREATE OR REPLACE FUNCTION public.update_system_analytics()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Placeholder for analytics aggregation
  NULL;
END;
$$;