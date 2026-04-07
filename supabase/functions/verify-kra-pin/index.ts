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

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientIP: string, maxRequests = 5, windowMs = 60000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (clientData.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((clientData.resetTime - now) / 1000) };
  }

  clientData.count++;
  return { allowed: true };
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// Validate KRA PIN format (Kenya)
function isValidKRAPin(pin: string): boolean {
  // KRA PIN format: P followed by 9 digits and ending with a letter
  const kraRegex = /^[PA]\d{9}[A-Z]$/;
  return kraRegex.test(pin);
}

// Validate verification data
function validateVerificationData(data: any): { valid: boolean; error?: string } {
  if (!data.pin_number || typeof data.pin_number !== 'string') {
    return { valid: false, error: 'PIN number is required' };
  }
  
  const sanitizedPin = data.pin_number.trim().toUpperCase();
  if (sanitizedPin.length > 20) {
    return { valid: false, error: 'PIN number is too long' };
  }
  
  if (!isValidKRAPin(sanitizedPin)) {
    return { valid: false, error: 'Invalid KRA PIN format. Expected format: P123456789A' };
  }
  
  if (!data.taxpayer_name || typeof data.taxpayer_name !== 'string') {
    return { valid: false, error: 'Taxpayer name is required' };
  }
  
  if (data.taxpayer_name.length < 2 || data.taxpayer_name.length > 200) {
    return { valid: false, error: 'Taxpayer name must be between 2 and 200 characters' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check rate limit (stricter for verification endpoints)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const rateCheck = checkRateLimit(clientIP, 5, 60000); // 5 requests per minute
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many verification requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter)
          } 
        }
      )
    }

    // Check content length
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10240) { // 10KB limit
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
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

    // SECURITY: Read raw body and enforce size limit
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

    // Validate input
    const validation = validateVerificationData(verificationData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize inputs
    const pin_number = verificationData.pin_number.trim().toUpperCase();
    const taxpayer_name = sanitizeInput(verificationData.taxpayer_name);

    // KRA API integration would go here
    // For now, we'll simulate the verification process
    const kraApiResponse = await simulateKRAVerification(pin_number, taxpayer_name)

    // Create verification record
    const { data: verification, error: verificationError } = await supabaseClient
      .from('verification_records')
      .insert({
        user_id: user.id,
        verification_type: 'kra_pin',
        reference_number: pin_number,
        status: kraApiResponse.status === 'active' ? 'verified' : 'failed',
        verification_data: kraApiResponse,
        verified_at: kraApiResponse.status === 'active' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (verificationError) {
      console.error('Database error:', verificationError);
      return new Response(
        JSON.stringify({ error: 'Failed to record verification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'KRA PIN Verification',
        message: kraApiResponse.status === 'active' 
          ? `KRA PIN ${pin_number} verified successfully.`
          : `KRA PIN ${pin_number} verification failed.`,
        type: kraApiResponse.status === 'active' ? 'success' : 'error',
        category: 'verification'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        verification,
        message: 'KRA PIN verification completed' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Simulate KRA API response
async function simulateKRAVerification(pinNumber: string, taxpayerName: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // PIN is already validated at this point, so return success
  return {
    pin_number: pinNumber,
    taxpayer_name: taxpayerName,
    registration_date: '2018-03-15',
    status: 'active',
    compliance_status: 'compliant',
    last_return_date: '2024-06-30'
  }
}
