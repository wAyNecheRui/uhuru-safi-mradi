-- Modify encrypt_sensitive_data function to allow demo mode (return data as-is when no key configured)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN data;
  END IF;
  
  -- Try to get key from vault first
  BEGIN
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CITIZEN_DATA_ENCRYPTION_KEY'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    encryption_key := NULL;
  END;
  
  -- Fallback to environment variable if vault not available
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := current_setting('app.encryption_key', true);
  END IF;
  
  -- DEMO MODE: If no key configured, return data unencrypted for testing
  -- This allows the system to work without encryption for demo/testing purposes
  IF encryption_key IS NULL OR encryption_key = '' THEN
    -- Return with a demo prefix so we know it's unencrypted demo data
    RETURN '[DEMO] ' || data;
  END IF;
  
  RETURN encode(encrypt(data::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$;

-- Add comment explaining demo mode
COMMENT ON FUNCTION public.encrypt_sensitive_data IS 'Encrypts sensitive data. In DEMO mode (no encryption key configured), returns data with [DEMO] prefix instead of failing.';

-- Also update decrypt function to handle demo data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN encrypted_data;
  END IF;
  
  -- Handle demo data (unencrypted with [DEMO] prefix)
  IF encrypted_data LIKE '[DEMO] %' THEN
    RETURN substring(encrypted_data FROM 8);
  END IF;
  
  -- Try to get key from vault first
  BEGIN
    SELECT decrypted_secret INTO encryption_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'CITIZEN_DATA_ENCRYPTION_KEY'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    encryption_key := NULL;
  END;
  
  -- Fallback to environment variable if vault not available
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := current_setting('app.encryption_key', true);
  END IF;
  
  -- If still no key, return masked data
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RETURN '***ENCRYPTED***';
  END IF;
  
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    -- Return masked data if decryption fails (for backwards compatibility during migration)
    RETURN '***ENCRYPTED***';
END;
$$;

COMMENT ON FUNCTION public.decrypt_sensitive_data IS 'Decrypts sensitive data. Handles [DEMO] prefixed data for testing mode.';