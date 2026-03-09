-- SECURITY FIX: Revert handle_new_user to ALWAYS set user_type to 'citizen'.
-- Migration 20260308 introduced a privilege escalation by storing the user-requested
-- type directly. This restores the secure behavior from 20260305.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_requested_type TEXT;
BEGIN
  v_requested_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'citizen');
  
  -- SECURITY: Always create as citizen. user_type is updated ONLY when admin
  -- approves a verification_request via RoleService.approveVerificationRequest.
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
$function$;

-- SECURITY FIX: Revert any users who self-elevated via the broken trigger.
-- Only upgrade user_type if they have a matching APPROVED role in user_roles.
UPDATE public.user_profiles
SET user_type = 'citizen'
WHERE user_type IN ('contractor', 'government')
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = user_profiles.user_id
  AND ur.role::text = user_profiles.user_type
);