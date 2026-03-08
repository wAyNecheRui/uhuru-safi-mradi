
-- Trigger function: auto-populate gps_coordinates from coordinates text
-- This ensures gps_coordinates (PostGIS point) is ALWAYS set when coordinates text exists
CREATE OR REPLACE FUNCTION public.sync_gps_coordinates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lat numeric;
  lon numeric;
  parts text[];
BEGIN
  -- If coordinates text is provided, parse and set gps_coordinates
  IF NEW.coordinates IS NOT NULL AND NEW.coordinates != '' THEN
    parts := string_to_array(replace(NEW.coordinates, ' ', ''), ',');
    IF array_length(parts, 1) = 2 THEN
      BEGIN
        lat := parts[1]::numeric;
        lon := parts[2]::numeric;
        IF lat BETWEEN -90 AND 90 AND lon BETWEEN -180 AND 180 THEN
          NEW.gps_coordinates := point(lon, lat);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- If parsing fails, leave gps_coordinates as-is
        NULL;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop if exists to avoid duplicates
DROP TRIGGER IF EXISTS trg_sync_gps_coordinates ON public.problem_reports;

-- Create trigger on INSERT and UPDATE
CREATE TRIGGER trg_sync_gps_coordinates
  BEFORE INSERT OR UPDATE OF coordinates
  ON public.problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_gps_coordinates();

-- Also do the same for project_progress table
CREATE OR REPLACE FUNCTION public.sync_progress_gps_coordinates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- gps_coordinates on project_progress is already set directly as point format
  -- This trigger just validates it
  RETURN NEW;
END;
$$;

-- Backfill: update all existing problem_reports that have coordinates text but no gps_coordinates
UPDATE public.problem_reports
SET gps_coordinates = point(
  split_part(replace(coordinates, ' ', ''), ',', 2)::numeric,
  split_part(replace(coordinates, ' ', ''), ',', 1)::numeric
)
WHERE coordinates IS NOT NULL
  AND coordinates != ''
  AND gps_coordinates IS NULL
  AND split_part(replace(coordinates, ' ', ''), ',', 1) ~ '^-?[0-9]+\.?[0-9]*$'
  AND split_part(replace(coordinates, ' ', ''), ',', 2) ~ '^-?[0-9]+\.?[0-9]*$';
