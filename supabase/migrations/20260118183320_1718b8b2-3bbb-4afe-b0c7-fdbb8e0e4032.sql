-- Drop existing functions with their exact signatures
DROP FUNCTION IF EXISTS public.can_user_vote(numeric, numeric, uuid);
DROP FUNCTION IF EXISTS public.can_user_verify(numeric, numeric, uuid);
DROP FUNCTION IF EXISTS public.get_contractor_projects(uuid);
DROP FUNCTION IF EXISTS public.get_government_problems(uuid);

-- 1. Recreate can_user_vote() with auth validation using SECURITY INVOKER
CREATE FUNCTION public.can_user_vote(user_lat numeric, user_lon numeric, report_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user hasn't already voted on this report
  RETURN NOT EXISTS (
    SELECT 1 FROM community_votes cv
    WHERE cv.user_id = auth.uid() AND cv.report_id = can_user_vote.report_id
  );
END;
$$;

-- 2. Recreate can_user_verify() with auth validation using SECURITY INVOKER  
CREATE FUNCTION public.can_user_verify(user_lat numeric, user_lon numeric, report_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Check verification eligibility (not the reporter, hasn't already verified)
  RETURN NOT EXISTS (
    SELECT 1 FROM problem_reports pr
    WHERE pr.id = can_user_verify.report_id AND pr.reported_by = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM community_votes cv
    WHERE cv.user_id = auth.uid() 
      AND cv.report_id = can_user_verify.report_id 
      AND cv.vote_type = 'verify'
  );
END;
$$;

-- 3. Recreate get_contractor_projects() with auth validation
CREATE FUNCTION public.get_contractor_projects(contractor_user_id uuid)
RETURNS TABLE (
  project_id uuid,
  project_title text,
  project_status text,
  budget numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- User can only fetch their own contractor projects
  IF auth.uid() != contractor_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only view your own projects';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.title as project_title,
    p.status as project_status,
    p.budget,
    p.created_at
  FROM projects p
  WHERE p.contractor_id = contractor_user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- 4. Recreate get_government_problems() with auth validation
CREATE FUNCTION public.get_government_problems(gov_user_id uuid)
RETURNS TABLE (
  problem_id uuid,
  title text,
  description text,
  location text,
  status text,
  priority text,
  created_at timestamptz,
  category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_counties text[];
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- User can only fetch problems for themselves
  IF auth.uid() != gov_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only view problems assigned to you';
  END IF;

  -- Get the government user's assigned counties
  SELECT gp.assigned_counties INTO user_counties
  FROM government_profiles gp
  WHERE gp.user_id = gov_user_id;

  -- If no counties assigned, return empty
  IF user_counties IS NULL OR array_length(user_counties, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    pr.id as problem_id,
    pr.title,
    pr.description,
    pr.location,
    pr.status,
    pr.priority,
    pr.created_at,
    pr.category
  FROM problem_reports pr
  WHERE pr.deleted_at IS NULL
    AND (
      EXISTS (
        SELECT 1 FROM unnest(user_counties) county
        WHERE pr.location ILIKE '%' || county || '%'
           OR pr.ward ILIKE '%' || county || '%'
           OR pr.constituency ILIKE '%' || county || '%'
      )
    )
  ORDER BY pr.created_at DESC;
END;
$$;

-- Add comments documenting the security controls
COMMENT ON FUNCTION public.can_user_vote(numeric, numeric, uuid) IS 'Checks if authenticated user can vote on a report. SECURITY INVOKER - uses auth.uid() for validation.';
COMMENT ON FUNCTION public.can_user_verify(numeric, numeric, uuid) IS 'Checks if authenticated user can verify a report. SECURITY INVOKER - uses auth.uid() for validation.';
COMMENT ON FUNCTION public.get_contractor_projects(uuid) IS 'Gets projects for a contractor. SECURITY DEFINER with auth validation - caller must match contractor_user_id.';
COMMENT ON FUNCTION public.get_government_problems(uuid) IS 'Gets problems for a government user based on assigned counties. SECURITY DEFINER with auth validation - caller must match gov_user_id.';