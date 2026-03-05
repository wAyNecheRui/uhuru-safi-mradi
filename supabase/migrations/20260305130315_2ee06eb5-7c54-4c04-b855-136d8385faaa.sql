
-- 1. Replay protection: table to track processed callback nonces
CREATE TABLE IF NOT EXISTS public.callback_nonces (
  nonce TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_ip TEXT,
  callback_type TEXT
);

-- Auto-cleanup old nonces (keep 24 hours)
CREATE INDEX idx_callback_nonces_processed_at ON public.callback_nonces (processed_at);

-- 2. Server-side rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 minute')
);

CREATE INDEX idx_rate_limits_key ON public.rate_limits (key);
CREATE INDEX idx_rate_limits_expires ON public.rate_limits (expires_at);

-- Rate limit check function (returns true if allowed)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Clean expired entries
  DELETE FROM rate_limits WHERE expires_at < now();
  
  -- Get current window
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM rate_limits
  WHERE key = p_key AND expires_at > now()
  ORDER BY window_start DESC
  LIMIT 1;
  
  IF v_count IS NULL THEN
    -- New window
    INSERT INTO rate_limits (key, request_count, window_start, expires_at)
    VALUES (p_key, 1, now(), now() + (p_window_seconds || ' seconds')::interval);
    RETURN TRUE;
  END IF;
  
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Increment
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE key = p_key AND window_start = v_window_start;
  
  RETURN TRUE;
END;
$$;

-- 3. Update handle_new_user to ALWAYS set user_type to 'citizen'
-- Government/contractor roles require admin approval
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_requested_type TEXT;
BEGIN
  v_requested_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'citizen');
  
  -- SECURITY: Always create as citizen. Elevated roles require admin approval.
  INSERT INTO public.user_profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'citizen'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- If user requested a non-citizen role, auto-create a verification request
  IF v_requested_type IN ('contractor', 'government') THEN
    INSERT INTO public.verification_requests (user_id, requested_role, justification, status)
    VALUES (
      NEW.id,
      v_requested_type,
      'Auto-created from registration as ' || v_requested_type,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Update assign_default_role to ALWAYS assign 'citizen' role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- SECURITY: Always assign citizen role. Elevated roles require admin approval.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'citizen'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. RLS on callback_nonces (service role only)
ALTER TABLE public.callback_nonces ENABLE ROW LEVEL SECURITY;

-- 6. RLS on rate_limits (service role only, no public access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 7. Nonce cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_nonces()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM callback_nonces WHERE processed_at < now() - interval '24 hours';
  DELETE FROM rate_limits WHERE expires_at < now();
$$;
