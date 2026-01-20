-- Drop and recreate get_top_bids_for_approval function to include AGPO category for better contractor comparison
DROP FUNCTION IF EXISTS public.get_top_bids_for_approval(uuid);

CREATE OR REPLACE FUNCTION public.get_top_bids_for_approval(p_report_id uuid)
RETURNS TABLE (
  bid_id uuid,
  contractor_id uuid,
  contractor_name text,
  bid_amount numeric,
  estimated_duration integer,
  price_score numeric,
  technical_score numeric,
  experience_score numeric,
  agpo_bonus numeric,
  total_score numeric,
  is_agpo boolean,
  agpo_category text,
  years_in_business integer,
  previous_projects_count integer,
  max_project_capacity numeric,
  rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cb.id as bid_id,
    cb.contractor_id,
    COALESCE(cp.company_name, 'Unknown Contractor') as contractor_name,
    cb.bid_amount,
    cb.estimated_duration,
    cb.price_score,
    cb.technical_score,
    cb.experience_score,
    cb.agpo_bonus,
    cb.total_score,
    COALESCE(cp.is_agpo, false) as is_agpo,
    cp.agpo_category,
    cp.years_in_business,
    cp.previous_projects_count,
    cp.max_project_capacity,
    ROW_NUMBER() OVER (ORDER BY cb.total_score DESC)::integer as rank
  FROM contractor_bids cb
  LEFT JOIN contractor_profiles cp ON cp.user_id = cb.contractor_id
  WHERE cb.report_id = p_report_id
    AND cb.status IN ('submitted', 'evaluated')
    AND cb.deleted_at IS NULL
  ORDER BY cb.total_score DESC
  LIMIT 3;
END;
$$;