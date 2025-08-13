-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_system_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert daily metrics
  INSERT INTO public.system_analytics (metric_name, metric_value, metric_date, category)
  VALUES 
    (
      'total_reports',
      (SELECT COUNT(*) FROM public.problem_reports WHERE DATE(created_at) = CURRENT_DATE),
      CURRENT_DATE,
      'reports'
    ),
    (
      'approved_projects',
      (SELECT COUNT(*) FROM public.problem_reports WHERE status = 'approved' AND DATE(approved_at) = CURRENT_DATE),
      CURRENT_DATE,
      'projects'
    ),
    (
      'active_contractors',
      (SELECT COUNT(DISTINCT contractor_id) FROM public.projects WHERE status IN ('in_progress', 'planning')),
      CURRENT_DATE,
      'contractors'
    ),
    (
      'pending_payments',
      (SELECT COUNT(*) FROM public.payment_transactions WHERE status = 'pending'),
      CURRENT_DATE,
      'payments'
    )
  ON CONFLICT (metric_name, metric_date) DO UPDATE SET
    metric_value = EXCLUDED.metric_value,
    created_at = now();
END;
$$;

-- Fix the other function with search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;