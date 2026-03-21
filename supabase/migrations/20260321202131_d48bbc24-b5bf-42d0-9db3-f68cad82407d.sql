
-- Haversine distance function (returns km)
CREATE OR REPLACE FUNCTION public.haversine_distance_km(
  lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric
)
RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT 6371 * 2 * asin(sqrt(
    sin(radians((lat2 - lat1) / 2))^2 +
    cos(radians(lat1)) * cos(radians(lat2)) *
    sin(radians((lon2 - lon1) / 2))^2
  ))
$$;

-- Update can_user_vote (lat/lon overload) to enforce 50km radius
CREATE OR REPLACE FUNCTION public.can_user_vote(
  user_lat numeric, user_lon numeric, report_id uuid
)
RETURNS boolean
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_coords text;
  report_lat numeric;
  report_lon numeric;
  distance_km numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  -- Already voted?
  IF EXISTS (
    SELECT 1 FROM community_votes cv
    WHERE cv.user_id = auth.uid() AND cv.report_id = can_user_vote.report_id
  ) THEN RETURN false; END IF;

  -- Can't vote on own report
  IF EXISTS (
    SELECT 1 FROM problem_reports pr
    WHERE pr.id = can_user_vote.report_id AND pr.reported_by = auth.uid()
  ) THEN RETURN false; END IF;

  -- Get report coordinates
  SELECT pr.coordinates INTO report_coords
  FROM problem_reports pr WHERE pr.id = can_user_vote.report_id;

  -- If report has no coordinates, allow (graceful fallback)
  IF report_coords IS NULL OR report_coords = '' THEN RETURN true; END IF;

  -- Parse "lat, lon" format
  BEGIN
    report_lat := split_part(report_coords, ',', 1)::numeric;
    report_lon := split_part(report_coords, ',', 2)::numeric;
  EXCEPTION WHEN OTHERS THEN
    RETURN true; -- Can't parse, allow
  END;

  -- Check 50km radius
  distance_km := haversine_distance_km(user_lat, user_lon, report_lat, report_lon);
  RETURN distance_km <= 50;
END;
$$;

-- Update can_user_verify (lat/lon overload) to enforce 10km radius
CREATE OR REPLACE FUNCTION public.can_user_verify(
  user_lat numeric, user_lon numeric, report_id uuid
)
RETURNS boolean
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_coords text;
  report_lat numeric;
  report_lon numeric;
  distance_km numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  -- Get report coordinates
  SELECT pr.coordinates INTO report_coords
  FROM problem_reports pr WHERE pr.id = can_user_verify.report_id;

  -- If report has no coordinates, allow
  IF report_coords IS NULL OR report_coords = '' THEN RETURN true; END IF;

  BEGIN
    report_lat := split_part(report_coords, ',', 1)::numeric;
    report_lon := split_part(report_coords, ',', 2)::numeric;
  EXCEPTION WHEN OTHERS THEN
    RETURN true;
  END;

  -- Check 10km radius
  distance_km := haversine_distance_km(user_lat, user_lon, report_lat, report_lon);
  RETURN distance_km <= 10;
END;
$$;

-- New: Verify milestone proximity (citizen must be within 10km of project location)
CREATE OR REPLACE FUNCTION public.can_verify_milestone(
  user_lat numeric, user_lon numeric, p_milestone_id uuid
)
RETURNS boolean
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_coords text;
  report_lat numeric;
  report_lon numeric;
  distance_km numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  -- Already verified this milestone?
  IF EXISTS (
    SELECT 1 FROM milestone_verifications mv
    WHERE mv.verifier_id = auth.uid() AND mv.milestone_id = p_milestone_id
  ) THEN RETURN false; END IF;

  -- Get the report coordinates through: milestone -> project -> report
  SELECT pr.coordinates INTO report_coords
  FROM project_milestones pm
  JOIN projects p ON p.id = pm.project_id
  JOIN problem_reports pr ON pr.id = p.report_id
  WHERE pm.id = p_milestone_id;

  -- No coordinates on file = allow (graceful)
  IF report_coords IS NULL OR report_coords = '' THEN RETURN true; END IF;

  BEGIN
    report_lat := split_part(report_coords, ',', 1)::numeric;
    report_lon := split_part(report_coords, ',', 2)::numeric;
  EXCEPTION WHEN OTHERS THEN
    RETURN true;
  END;

  distance_km := haversine_distance_km(user_lat, user_lon, report_lat, report_lon);
  RETURN distance_km <= 10;
END;
$$;

-- New: Validate contractor can bid (registered_counties must include report location)
CREATE OR REPLACE FUNCTION public.can_contractor_bid(
  p_contractor_id uuid, p_report_id uuid
)
RETURNS boolean
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contractor_counties text[];
  report_location text;
  report_constituency text;
BEGIN
  -- Get contractor's registered counties
  SELECT cp.registered_counties INTO contractor_counties
  FROM contractor_profiles cp WHERE cp.user_id = p_contractor_id;

  -- No counties registered = allow (new contractor, not yet configured)
  IF contractor_counties IS NULL OR array_length(contractor_counties, 1) IS NULL THEN
    RETURN true;
  END IF;

  -- Get report location info
  SELECT pr.location, pr.constituency INTO report_location, report_constituency
  FROM problem_reports pr WHERE pr.id = p_report_id;

  -- No location on report = allow
  IF report_location IS NULL AND report_constituency IS NULL THEN
    RETURN true;
  END IF;

  -- Check if any registered county appears in the report's location text
  FOR i IN 1..array_length(contractor_counties, 1) LOOP
    IF report_location IS NOT NULL AND 
       report_location ILIKE '%' || contractor_counties[i] || '%' THEN
      RETURN true;
    END IF;
    IF report_constituency IS NOT NULL AND 
       report_constituency ILIKE '%' || contractor_counties[i] || '%' THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;
