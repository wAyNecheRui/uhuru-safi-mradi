-- Fix the last function missing search_path
CREATE OR REPLACE FUNCTION public.calculate_distance_km(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  r numeric := 6371; -- Earth radius in km
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) * sin(dlat / 2)
     + cos(radians(lat1)) * cos(radians(lat2))
     * sin(dlon / 2) * sin(dlon / 2);
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  RETURN r * c;
END;
$$;