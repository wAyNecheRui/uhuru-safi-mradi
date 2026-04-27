/*
-- Migration: Fix get_problems_with_distance to include reported_by
-- This allows the frontend to correctly identify "own reports" for voting logic.

DROP FUNCTION IF EXISTS public.get_problems_with_distance(numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.get_problems_with_distance(user_lat numeric, user_lon numeric, max_distance_km numeric DEFAULT 20)
RETURNS TABLE(
  id uuid, 
  title text, 
  description text, 
  category text, 
  priority text, 
  status text, 
  location text, 
  coordinates text, 
  county text, 
  constituency text, 
  ward text, 
  estimated_cost numeric, 
  affected_population integer, 
  priority_score integer, 
  verified_votes integer, 
  created_at timestamp with time zone, 
  photo_urls text[], 
  reported_by uuid, -- ADDED THIS FIELD
  distance_km numeric, 
  distance_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY: Validate coordinate ranges
  IF user_lat IS NULL OR user_lon IS NULL THEN
    RAISE EXCEPTION 'Latitude and longitude are required';
  END IF;
  
  IF user_lat < -90 OR user_lat > 90 THEN
    RAISE EXCEPTION 'Invalid latitude: must be between -90 and 90';
  END IF;
  
  IF user_lon < -180 OR user_lon > 180 THEN
    RAISE EXCEPTION 'Invalid longitude: must be between -180 and 180';
  END IF;
  
  -- SECURITY: Validate max distance (prevent resource exhaustion)
  IF max_distance_km IS NULL OR max_distance_km <= 0 THEN
    max_distance_km := 20;
  ELSIF max_distance_km > 500 THEN
    max_distance_km := 500; -- Cap at 500km
  END IF;

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
    pr.reported_by, -- ADDED THIS FIELD
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
    END ASC
  LIMIT 100;
END;
$$;
*/
-- Temporarily disabled to unblock location coordinates deployment
SELECT 1;
