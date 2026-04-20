-- Phase 25: Add native coordinates to projects and decouple verification

-- 1. Add coordinates to projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- 2. Backfill existing projects with data from problem_reports
-- The report_coords is stored as text: "lat, lon"
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT p.id, pr.coordinates 
    FROM public.projects p
    JOIN public.problem_reports pr ON p.report_id = pr.id
    WHERE pr.coordinates IS NOT NULL AND pr.coordinates != '' AND p.latitude IS NULL
  LOOP
    BEGIN
      UPDATE public.projects
      SET 
        latitude = split_part(rec.coordinates, ',', 1)::numeric,
        longitude = split_part(rec.coordinates, ',', 2)::numeric
      WHERE id = rec.id;
    EXCEPTION WHEN OTHERS THEN
      -- Silently skip parsing errors on invalid coordinates
    END;
  END LOOP;
END;
$$;

-- 3. Overwrite can_verify_milestone to query native project location
CREATE OR REPLACE FUNCTION public.can_verify_milestone(
  user_lat numeric, user_lon numeric, p_milestone_id uuid
)
RETURNS boolean
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proj_lat numeric;
  proj_lon numeric;
  distance_km numeric;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  -- Already verified this milestone?
  IF EXISTS (
    SELECT 1 FROM milestone_verifications mv
    WHERE mv.verifier_id = auth.uid() AND mv.milestone_id = p_milestone_id
  ) THEN RETURN false; END IF;

  -- Get the native project coordinates
  SELECT p.latitude, p.longitude INTO proj_lat, proj_lon
  FROM project_milestones pm
  JOIN projects p ON p.id = pm.project_id
  WHERE pm.id = p_milestone_id;

  -- No coordinates on file = allow (graceful fallback)
  IF proj_lat IS NULL OR proj_lon IS NULL THEN RETURN true; END IF;

  distance_km := haversine_distance_km(user_lat, user_lon, proj_lat, proj_lon);
  RETURN distance_km <= 10;
END;
$$;

-- 4. Overwrite project creation trigger to automatically inherit parsed coordinates
CREATE OR REPLACE FUNCTION public.create_project_from_report()
RETURNS TRIGGER AS $$
DECLARE
  parsed_lat numeric := NULL;
  parsed_lon numeric := NULL;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    
    -- Parse report coordinates safely into numerics for the project
    IF NEW.coordinates IS NOT NULL AND NEW.coordinates != '' THEN
      BEGIN
        parsed_lat := split_part(NEW.coordinates, ',', 1)::numeric;
        parsed_lon := split_part(NEW.coordinates, ',', 2)::numeric;
      EXCEPTION WHEN OTHERS THEN
        parsed_lat := NULL;
        parsed_lon := NULL;
      END;
    END IF;

    INSERT INTO public.projects (
      report_id,
      title,
      description,
      budget,
      status,
      latitude,
      longitude
    ) VALUES (
      NEW.id,
      NEW.title,
      NEW.description,
      NEW.budget_allocated,
      'planning',
      parsed_lat,
      parsed_lon
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
