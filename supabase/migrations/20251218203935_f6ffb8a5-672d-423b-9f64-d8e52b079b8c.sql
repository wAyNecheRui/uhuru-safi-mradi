-- Add constituency and ward to problem_reports for location filtering
ALTER TABLE public.problem_reports 
ADD COLUMN IF NOT EXISTS constituency TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT,
ADD COLUMN IF NOT EXISTS verified_votes INTEGER DEFAULT 0;

-- Add registered_counties and capacity to contractor_profiles for filtering
ALTER TABLE public.contractor_profiles
ADD COLUMN IF NOT EXISTS registered_counties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS max_project_capacity NUMERIC DEFAULT 5000000,
ADD COLUMN IF NOT EXISTS is_agpo BOOLEAN DEFAULT false;

-- Add assigned_counties to government_profiles for jurisdiction
ALTER TABLE public.government_profiles
ADD COLUMN IF NOT EXISTS assigned_counties TEXT[] DEFAULT '{}';

-- Create function to calculate distance between coordinates
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius CONSTANT DECIMAL := 6371; -- Earth's radius in km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN earth_radius * c;
END;
$$;

-- Function to get problems with distance from user location
CREATE OR REPLACE FUNCTION public.get_problems_with_distance(
  user_lat DECIMAL,
  user_lon DECIMAL,
  max_distance_km DECIMAL DEFAULT 20
) RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  location TEXT,
  coordinates TEXT,
  county TEXT,
  constituency TEXT,
  ward TEXT,
  estimated_cost NUMERIC,
  affected_population INTEGER,
  priority_score INTEGER,
  verified_votes INTEGER,
  created_at TIMESTAMPTZ,
  photo_urls TEXT[],
  distance_km DECIMAL,
  distance_category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prob_lat DECIMAL;
  prob_lon DECIMAL;
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.title,
    pr.description,
    pr.category,
    pr.priority,
    pr.status,
    pr.location,
    pr.coordinates,
    (SELECT up.county FROM user_profiles up WHERE up.user_id = pr.reported_by LIMIT 1) as county,
    pr.constituency,
    pr.ward,
    pr.estimated_cost,
    pr.affected_population,
    pr.priority_score,
    pr.verified_votes,
    pr.created_at,
    pr.photo_urls,
    CASE 
      WHEN pr.coordinates IS NOT NULL AND pr.coordinates LIKE '%,%' THEN
        calculate_distance_km(
          user_lat,
          user_lon,
          CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
          CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
        )
      ELSE NULL
    END as distance_km,
    CASE 
      WHEN pr.coordinates IS NOT NULL AND pr.coordinates LIKE '%,%' THEN
        CASE
          WHEN calculate_distance_km(
            user_lat,
            user_lon,
            CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
            CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
          ) <= 5 THEN 'urgent'
          WHEN calculate_distance_km(
            user_lat,
            user_lon,
            CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
            CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
          ) <= 10 THEN 'nearby'
          ELSE 'county'
        END
      ELSE 'unknown'
    END as distance_category
  FROM problem_reports pr
  WHERE pr.status NOT IN ('rejected', 'completed')
  AND (
    pr.coordinates IS NULL 
    OR pr.coordinates NOT LIKE '%,%'
    OR calculate_distance_km(
      user_lat,
      user_lon,
      CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
      CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
    ) <= max_distance_km
  )
  ORDER BY 
    CASE 
      WHEN pr.coordinates IS NOT NULL AND pr.coordinates LIKE '%,%' THEN
        calculate_distance_km(
          user_lat,
          user_lon,
          CAST(split_part(pr.coordinates, ',', 1) AS DECIMAL),
          CAST(split_part(pr.coordinates, ',', 2) AS DECIMAL)
        )
      ELSE 9999
    END ASC;
END;
$$;

-- Function to check if user can vote (within 50km)
CREATE OR REPLACE FUNCTION public.can_user_vote(
  user_lat DECIMAL,
  user_lon DECIMAL,
  report_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_coords TEXT;
  distance DECIMAL;
BEGIN
  SELECT coordinates INTO report_coords FROM problem_reports WHERE id = report_id;
  
  IF report_coords IS NULL OR report_coords NOT LIKE '%,%' THEN
    RETURN TRUE; -- Allow voting if no coords
  END IF;
  
  distance := calculate_distance_km(
    user_lat,
    user_lon,
    CAST(split_part(report_coords, ',', 1) AS DECIMAL),
    CAST(split_part(report_coords, ',', 2) AS DECIMAL)
  );
  
  RETURN distance <= 50;
END;
$$;

-- Function to check if user can verify (within 10km)
CREATE OR REPLACE FUNCTION public.can_user_verify(
  user_lat DECIMAL,
  user_lon DECIMAL,
  report_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_coords TEXT;
  distance DECIMAL;
BEGIN
  SELECT coordinates INTO report_coords FROM problem_reports WHERE id = report_id;
  
  IF report_coords IS NULL OR report_coords NOT LIKE '%,%' THEN
    RETURN TRUE; -- Allow verification if no coords
  END IF;
  
  distance := calculate_distance_km(
    user_lat,
    user_lon,
    CAST(split_part(report_coords, ',', 1) AS DECIMAL),
    CAST(split_part(report_coords, ',', 2) AS DECIMAL)
  );
  
  RETURN distance <= 10;
END;
$$;

-- Function to get projects for contractors based on registered counties and capacity
CREATE OR REPLACE FUNCTION public.get_contractor_projects(
  contractor_user_id UUID
) RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  budget NUMERIC,
  status TEXT,
  report_id UUID,
  location TEXT,
  county TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contractor_counties TEXT[];
  contractor_capacity NUMERIC;
  is_agpo BOOLEAN;
BEGIN
  -- Get contractor settings
  SELECT cp.registered_counties, cp.max_project_capacity, cp.is_agpo
  INTO contractor_counties, contractor_capacity, is_agpo
  FROM contractor_profiles cp
  WHERE cp.user_id = contractor_user_id;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.budget,
    p.status,
    p.report_id,
    pr.location,
    (SELECT up.county FROM user_profiles up WHERE up.user_id = pr.reported_by LIMIT 1) as county,
    p.created_at
  FROM projects p
  LEFT JOIN problem_reports pr ON p.report_id = pr.id
  WHERE p.status IN ('planning', 'bidding')
  AND p.contractor_id IS NULL
  AND (p.budget IS NULL OR p.budget <= contractor_capacity)
  AND (
    is_agpo = TRUE 
    OR contractor_counties IS NULL 
    OR array_length(contractor_counties, 1) IS NULL
    OR EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = pr.reported_by 
      AND up.county = ANY(contractor_counties)
    )
  )
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get problems for government officials in their assigned counties
CREATE OR REPLACE FUNCTION public.get_government_problems(
  gov_user_id UUID
) RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  priority TEXT,
  status TEXT,
  location TEXT,
  county TEXT,
  priority_score INTEGER,
  total_votes BIGINT,
  estimated_cost NUMERIC,
  created_at TIMESTAMPTZ,
  photo_urls TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_counties TEXT[];
BEGIN
  -- Get assigned counties
  SELECT gp.assigned_counties INTO assigned_counties
  FROM government_profiles gp
  WHERE gp.user_id = gov_user_id;
  
  RETURN QUERY
  SELECT 
    pr.id,
    pr.title,
    pr.description,
    pr.category,
    pr.priority,
    pr.status,
    pr.location,
    (SELECT up.county FROM user_profiles up WHERE up.user_id = pr.reported_by LIMIT 1) as county,
    pr.priority_score,
    (SELECT COUNT(*) FROM community_votes cv WHERE cv.report_id = pr.id) as total_votes,
    pr.estimated_cost,
    pr.created_at,
    pr.photo_urls
  FROM problem_reports pr
  WHERE pr.status = 'pending'
  AND (
    assigned_counties IS NULL 
    OR array_length(assigned_counties, 1) IS NULL
    OR EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = pr.reported_by 
      AND up.county = ANY(assigned_counties)
    )
  )
  ORDER BY 
    CASE WHEN pr.priority_score >= 200 THEN 1 ELSE 2 END,
    pr.priority_score DESC,
    pr.created_at ASC;
END;
$$;