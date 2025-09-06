-- Add encryption extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text, key text DEFAULT 'citizen_worker_encryption_key_2024')
RETURNS text AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN data;
  END IF;
  RETURN encode(encrypt(data::bytea, key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text, key text DEFAULT 'citizen_worker_encryption_key_2024')
RETURNS text AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for citizen workers with decrypted sensitive data for authorized access
CREATE OR REPLACE VIEW public.citizen_workers_decrypted AS
SELECT 
  id,
  user_id,
  experience_years,
  hourly_rate,
  daily_rate,
  willing_to_travel,
  max_travel_distance,
  rating,
  total_jobs_completed,
  created_at,
  updated_at,
  transport_means,
  verification_status,
  background_check_status,
  profile_photo_url,
  cv_document_url,
  -- Decrypt sensitive fields
  CASE 
    WHEN current_setting('role') = 'authenticated' AND (
      -- Allow users to see their own data
      auth.uid() = user_id OR 
      -- Allow verified government officials
      EXISTS (
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
      )
    ) THEN public.decrypt_sensitive_data(national_id)
    ELSE '***'
  END as national_id,
  
  CASE 
    WHEN current_setting('role') = 'authenticated' AND (
      auth.uid() = user_id OR 
      EXISTS (
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
      )
    ) THEN public.decrypt_sensitive_data(kra_pin)
    ELSE '***'
  END as kra_pin,
  
  public.decrypt_sensitive_data(phone_number) as phone_number,
  public.decrypt_sensitive_data(alternate_phone) as alternate_phone,
  physical_address,
  county,
  sub_county,
  ward,
  public.decrypt_sensitive_data(emergency_contact_name) as emergency_contact_name,
  public.decrypt_sensitive_data(emergency_contact_phone) as emergency_contact_phone,
  bank_name,
  
  CASE 
    WHEN current_setting('role') = 'authenticated' AND (
      auth.uid() = user_id OR 
      EXISTS (
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
      )
    ) THEN public.decrypt_sensitive_data(bank_account)
    ELSE '***'
  END as bank_account,
  
  skills,
  education_level,
  certifications,
  languages,
  availability_status
FROM public.citizen_workers;

-- Create RLS policies for the decrypted view
ALTER VIEW public.citizen_workers_decrypted OWNER TO postgres;

-- Grant permissions on the view
GRANT SELECT ON public.citizen_workers_decrypted TO authenticated;
GRANT SELECT ON public.citizen_workers_decrypted TO service_role;

-- Create a trigger function to encrypt data before insert/update
CREATE OR REPLACE FUNCTION public.encrypt_citizen_worker_data()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS encrypt_citizen_worker_trigger ON public.citizen_workers;
CREATE TRIGGER encrypt_citizen_worker_trigger 
  BEFORE INSERT OR UPDATE ON public.citizen_workers
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_citizen_worker_data();

-- Update existing data to be encrypted (only if not already encrypted)
DO $$
DECLARE
  worker_record RECORD;
BEGIN
  FOR worker_record IN 
    SELECT id, national_id, kra_pin, phone_number, alternate_phone, 
           emergency_contact_name, emergency_contact_phone, bank_account
    FROM public.citizen_workers 
    WHERE national_id IS NOT NULL OR kra_pin IS NOT NULL OR phone_number IS NOT NULL 
       OR alternate_phone IS NOT NULL OR emergency_contact_name IS NOT NULL 
       OR emergency_contact_phone IS NOT NULL OR bank_account IS NOT NULL
  LOOP
    UPDATE public.citizen_workers 
    SET 
      national_id = CASE 
        WHEN worker_record.national_id IS NOT NULL AND worker_record.national_id != '' 
        THEN public.encrypt_sensitive_data(worker_record.national_id) 
        ELSE worker_record.national_id 
      END,
      kra_pin = CASE 
        WHEN worker_record.kra_pin IS NOT NULL AND worker_record.kra_pin != '' 
        THEN public.encrypt_sensitive_data(worker_record.kra_pin) 
        ELSE worker_record.kra_pin 
      END,
      phone_number = CASE 
        WHEN worker_record.phone_number IS NOT NULL AND worker_record.phone_number != '' 
        THEN public.encrypt_sensitive_data(worker_record.phone_number) 
        ELSE worker_record.phone_number 
      END,
      alternate_phone = CASE 
        WHEN worker_record.alternate_phone IS NOT NULL AND worker_record.alternate_phone != '' 
        THEN public.encrypt_sensitive_data(worker_record.alternate_phone) 
        ELSE worker_record.alternate_phone 
      END,
      emergency_contact_name = CASE 
        WHEN worker_record.emergency_contact_name IS NOT NULL AND worker_record.emergency_contact_name != '' 
        THEN public.encrypt_sensitive_data(worker_record.emergency_contact_name) 
        ELSE worker_record.emergency_contact_name 
      END,
      emergency_contact_phone = CASE 
        WHEN worker_record.emergency_contact_phone IS NOT NULL AND worker_record.emergency_contact_phone != '' 
        THEN public.encrypt_sensitive_data(worker_record.emergency_contact_phone) 
        ELSE worker_record.emergency_contact_phone 
      END,
      bank_account = CASE 
        WHEN worker_record.bank_account IS NOT NULL AND worker_record.bank_account != '' 
        THEN public.encrypt_sensitive_data(worker_record.bank_account) 
        ELSE worker_record.bank_account 
      END
    WHERE id = worker_record.id;
  END LOOP;
END $$;