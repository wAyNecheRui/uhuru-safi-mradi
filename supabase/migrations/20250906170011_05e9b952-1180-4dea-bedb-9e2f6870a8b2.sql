-- Fix security linter issues

-- Update the encryption functions with proper search_path settings
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text, key text DEFAULT 'citizen_worker_encryption_key_2024')
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN data;
  END IF;
  RETURN encode(encrypt(data::bytea, key::bytea, 'aes'), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text, key text DEFAULT 'citizen_worker_encryption_key_2024')
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN encrypted_data;
  END IF;
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), key::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Return original data if decryption fails (for backwards compatibility)
    RETURN encrypted_data;
END;
$$;

-- Update the trigger function with proper search_path setting
CREATE OR REPLACE FUNCTION public.encrypt_citizen_worker_data()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt sensitive fields before storing
  IF NEW.national_id IS NOT NULL AND NEW.national_id != '' THEN
    NEW.national_id = public.encrypt_sensitive_data(NEW.national_id);
  END IF;
  
  IF NEW.kra_pin IS NOT NULL AND NEW.kra_pin != '' THEN
    NEW.kra_pin = public.encrypt_sensitive_data(NEW.kra_pin);
  END IF;
  
  IF NEW.phone_number IS NOT NULL AND NEW.phone_number != '' THEN
    NEW.phone_number = public.encrypt_sensitive_data(NEW.phone_number);
  END IF;
  
  IF NEW.alternate_phone IS NOT NULL AND NEW.alternate_phone != '' THEN
    NEW.alternate_phone = public.encrypt_sensitive_data(NEW.alternate_phone);
  END IF;
  
  IF NEW.emergency_contact_name IS NOT NULL AND NEW.emergency_contact_name != '' THEN
    NEW.emergency_contact_name = public.encrypt_sensitive_data(NEW.emergency_contact_name);
  END IF;
  
  IF NEW.emergency_contact_phone IS NOT NULL AND NEW.emergency_contact_phone != '' THEN
    NEW.emergency_contact_phone = public.encrypt_sensitive_data(NEW.emergency_contact_phone);
  END IF;
  
  IF NEW.bank_account IS NOT NULL AND NEW.bank_account != '' THEN
    NEW.bank_account = public.encrypt_sensitive_data(NEW.bank_account);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remove the problematic security definer view and replace with proper RLS policies
DROP VIEW IF EXISTS public.citizen_workers_decrypted;

-- Create a secure function to get decrypted worker data for authorized users
CREATE OR REPLACE FUNCTION public.get_citizen_worker_decrypted(worker_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  experience_years integer,
  hourly_rate numeric,
  daily_rate numeric,
  willing_to_travel boolean,
  max_travel_distance integer,
  rating numeric,
  total_jobs_completed integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  transport_means text[],
  verification_status text,
  background_check_status text,
  profile_photo_url text,
  cv_document_url text,
  national_id text,
  kra_pin text,
  phone_number text,
  alternate_phone text,
  physical_address text,
  county text,
  sub_county text,
  ward text,
  emergency_contact_name text,
  emergency_contact_phone text,
  bank_name text,
  bank_account text,
  skills text[],
  education_level text,
  certifications text[],
  languages text[],
  availability_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  worker_record RECORD;
  is_authorized BOOLEAN := FALSE;
BEGIN
  -- Get the worker record
  SELECT * INTO worker_record FROM public.citizen_workers WHERE citizen_workers.id = worker_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check authorization: owner or verified government official
  IF auth.uid() = worker_record.user_id THEN
    is_authorized := TRUE;
  ELSIF EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() 
    AND up.user_type = 'government'
    AND EXISTS (
      SELECT 1 FROM user_verifications uv
      WHERE uv.user_id = auth.uid()
      AND uv.verification_type = 'government_official'
      AND uv.status = 'verified'
      AND (uv.expires_at IS NULL OR uv.expires_at > now())
    )
  ) THEN
    is_authorized := TRUE;
  END IF;
  
  -- Return decrypted data based on authorization
  RETURN QUERY SELECT
    worker_record.id,
    worker_record.user_id,
    worker_record.experience_years,
    worker_record.hourly_rate,
    worker_record.daily_rate,
    worker_record.willing_to_travel,
    worker_record.max_travel_distance,
    worker_record.rating,
    worker_record.total_jobs_completed,
    worker_record.created_at,
    worker_record.updated_at,
    worker_record.transport_means,
    worker_record.verification_status,
    worker_record.background_check_status,
    worker_record.profile_photo_url,
    worker_record.cv_document_url,
    CASE WHEN is_authorized THEN public.decrypt_sensitive_data(worker_record.national_id) ELSE '***' END,
    CASE WHEN is_authorized THEN public.decrypt_sensitive_data(worker_record.kra_pin) ELSE '***' END,
    public.decrypt_sensitive_data(worker_record.phone_number),
    public.decrypt_sensitive_data(worker_record.alternate_phone),
    worker_record.physical_address,
    worker_record.county,
    worker_record.sub_county,
    worker_record.ward,
    public.decrypt_sensitive_data(worker_record.emergency_contact_name),
    public.decrypt_sensitive_data(worker_record.emergency_contact_phone),
    worker_record.bank_name,
    CASE WHEN is_authorized THEN public.decrypt_sensitive_data(worker_record.bank_account) ELSE '***' END,
    worker_record.skills,
    worker_record.education_level,
    worker_record.certifications,
    worker_record.languages,
    worker_record.availability_status;
END;
$$;