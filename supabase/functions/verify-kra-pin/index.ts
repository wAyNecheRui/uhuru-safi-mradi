import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
}

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// Validate KRA PIN format (Kenya): starts with P or A, 9 digits, ends with letter
function isValidKRAPin(pin: string): boolean {
  const kraRegex = /^[PA]\d{9}[A-Z]$/;
  return kraRegex.test(pin);
}

// Validate National ID format (Kenya): 7-8 digits
function isValidNationalId(id: string): boolean {
  const idRegex = /^\d{7,8}$/;
  return idRegex.test(id);
}

function validateVerificationData(data: any): { valid: boolean; error?: string } {
  if (!data.verification_type || !['kra_pin', 'national_id'].includes(data.verification_type)) {
    return { valid: false, error: 'Invalid verification type. Must be kra_pin or national_id.' };
  }

  if (data.verification_type === 'kra_pin') {
    if (!data.pin_number || typeof data.pin_number !== 'string') {
      return { valid: false, error: 'KRA PIN number is required' };
    }
    const sanitizedPin = data.pin_number.trim().toUpperCase();
    if (sanitizedPin.length > 20) {
      return { valid: false, error: 'PIN number is too long' };
    }
    if (!isValidKRAPin(sanitizedPin)) {
      return { valid: false, error: 'Invalid KRA PIN format. Expected format: P123456789A (starts with P or A, 9 digits, ends with a letter)' };
    }
    if (!data.taxpayer_name || typeof data.taxpayer_name !== 'string' || data.taxpayer_name.length < 2 || data.taxpayer_name.length > 200) {
      return { valid: false, error: 'Taxpayer name is required (2-200 characters)' };
    }
  }

  if (data.verification_type === 'national_id') {
    if (!data.id_number || typeof data.id_number !== 'string') {
      return { valid: false, error: 'National ID number is required' };
    }
    const sanitizedId = data.id_number.trim();
    if (!isValidNationalId(sanitizedId)) {
      return { valid: false, error: 'Invalid National ID format. Must be 7-8 digits.' };
    }
    if (!data.holder_name || typeof data.holder_name !== 'string' || data.holder_name.length < 2 || data.holder_name.length > 200) {
      return { valid: false, error: 'ID holder name is required (2-200 characters)' };
    }
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // DB-backed rate limiting (5 req/min for verification)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const { data: rateLimitAllowed } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: `credential_verify:${clientIP}`,
      p_max_requests: 5,
      p_window_seconds: 60
    })
    if (rateLimitAllowed === false) {
      return new Response(
        JSON.stringify({ error: 'Too many verification requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    // Check content length
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10240) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse body
    const rawBody = await req.text()
    if (rawBody.length > 10240) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let verificationData: any
    try {
      verificationData = JSON.parse(rawBody)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate
    const validation = validateVerificationData(verificationData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const verificationType = verificationData.verification_type;

    if (verificationType === 'kra_pin') {
      const pin_number = verificationData.pin_number.trim().toUpperCase();
      const taxpayer_name = sanitizeInput(verificationData.taxpayer_name);

      // Check for duplicate KRA PIN already verified for another user
      const { data: existingVerified } = await supabaseAdmin
        .from('user_verifications')
        .select('user_id')
        .eq('verification_type', 'kra_pin')
        .eq('reference_number', pin_number)
        .eq('status', 'verified')
        .neq('user_id', user.id)
        .limit(1);

      if (existingVerified && existingVerified.length > 0) {
        return new Response(
          JSON.stringify({ error: 'This KRA PIN is already registered to another account. If this is an error, contact support.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Upsert verification record - status is pending until government reviews
      const { data: verification, error: verificationError } = await supabaseAdmin
        .from('user_verifications')
        .upsert({
          user_id: user.id,
          verification_type: 'kra_pin',
          reference_number: pin_number,
          status: 'pending',
          verification_data: {
            pin_number,
            taxpayer_name,
            submitted_at: new Date().toISOString(),
            format_validated: true,
          },
          verification_notes: `KRA PIN format validated. Taxpayer: ${taxpayer_name}. Awaiting government review.`,
        }, { onConflict: 'user_id,verification_type' })
        .select()
        .single();

      if (verificationError) {
        // Fallback: insert without upsert
        const { data: insertedVerification, error: insertError } = await supabaseAdmin
          .from('user_verifications')
          .insert({
            user_id: user.id,
            verification_type: 'kra_pin',
            reference_number: pin_number,
            status: 'pending',
            verification_data: {
              pin_number,
              taxpayer_name,
              submitted_at: new Date().toISOString(),
              format_validated: true,
            },
            verification_notes: `KRA PIN format validated. Taxpayer: ${taxpayer_name}. Awaiting government review.`,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Database error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to record verification' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Notify
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          title: 'KRA PIN Submitted',
          message: `Your KRA PIN ${pin_number} has been submitted for verification. A government official will review it within 24-48 hours.`,
          type: 'info',
          category: 'verification'
        });

        return new Response(
          JSON.stringify({ success: true, verification: insertedVerification, message: 'KRA PIN submitted for verification' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Notify user
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        title: 'KRA PIN Submitted',
        message: `Your KRA PIN ${pin_number} has been submitted for verification. A government official will review it within 24-48 hours.`,
        type: 'info',
        category: 'verification'
      });

      return new Response(
        JSON.stringify({ success: true, verification, message: 'KRA PIN submitted for verification' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (verificationType === 'national_id') {
      const id_number = verificationData.id_number.trim();
      const holder_name = sanitizeInput(verificationData.holder_name);

      // Check for duplicate National ID already verified for another user
      const { data: existingVerified } = await supabaseAdmin
        .from('user_verifications')
        .select('user_id')
        .eq('verification_type', 'national_id')
        .eq('reference_number', id_number)
        .eq('status', 'verified')
        .neq('user_id', user.id)
        .limit(1);

      if (existingVerified && existingVerified.length > 0) {
        return new Response(
          JSON.stringify({ error: 'This National ID is already registered to another account. If this is an error, contact support.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert verification record
      const { data: verification, error: verificationError } = await supabaseAdmin
        .from('user_verifications')
        .insert({
          user_id: user.id,
          verification_type: 'national_id',
          reference_number: id_number,
          status: 'pending',
          verification_data: {
            id_number,
            holder_name,
            submitted_at: new Date().toISOString(),
            format_validated: true,
          },
          verification_notes: `National ID format validated (${id_number.length} digits). Holder: ${holder_name}. Awaiting review.`,
        })
        .select()
        .single();

      if (verificationError) {
        console.error('Database error:', verificationError);
        return new Response(
          JSON.stringify({ error: 'Failed to record verification' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update user_profiles with national_id
      await supabaseAdmin
        .from('user_profiles')
        .update({ national_id: id_number })
        .eq('user_id', user.id);

      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        title: 'National ID Submitted',
        message: `Your National ID has been submitted for verification. It will be reviewed within 24-48 hours.`,
        type: 'info',
        category: 'verification'
      });

      return new Response(
        JSON.stringify({ success: true, verification, message: 'National ID submitted for verification' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported verification type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})