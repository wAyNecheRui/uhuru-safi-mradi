import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Server-side rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number; blocked?: number }>();

const checkRateLimit = (clientIP: string, maxRequests = 10, windowMs = 60000, blockDurationMs = 300000) => {
  const now = Date.now();
  const key = clientIP;
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingRequests: maxRequests - 1 };
  }

  // Check if blocked
  if (entry.blocked && now < entry.blocked) {
    return { allowed: false, retryAfter: Math.ceil((entry.blocked - now) / 1000) };
  }

  // Reset window if expired
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
    entry.blocked = undefined;
  } else {
    entry.count++;
  }

  // Block if exceeded
  if (entry.count > maxRequests) {
    entry.blocked = now + blockDurationMs;
    return { allowed: false, retryAfter: Math.ceil(blockDurationMs / 1000) };
  }

  return { allowed: true, remainingRequests: maxRequests - entry.count };
};

const MAX_BODY_SIZE = 51200; // 50KB

/**
 * Robust input sanitization using allowlist approach.
 * Strips ALL HTML tags, decodes HTML entities, removes dangerous URI schemes.
 */
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input;

  // 1. Decode HTML entities to catch encoded payloads like &#x6A;avascript:
  cleaned = cleaned
    .replace(/&#x([0-9a-fA-F]+);/g, (_m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m: string, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'");

  // 2. Remove ALL HTML/XML tags (including self-closing, SVG, etc.)
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 3. Remove dangerous URI schemes (javascript:, data:, vbscript:)
  cleaned = cleaned.replace(/\b(javascript|data|vbscript)\s*:/gi, '');

  // 4. Remove event handler patterns (onclick=, onerror=, onload=, etc.)
  cleaned = cleaned.replace(/\bon\w+\s*=/gi, '');

  // 5. Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // 6. Limit length
  cleaned = cleaned.trim().slice(0, 10000);

  return cleaned;
};

// Validate coordinate string
function isValidCoordinates(coords: string): boolean {
  if (typeof coords !== 'string') return false;
  const parts = coords.split(',').map(s => s.trim());
  if (parts.length !== 2) return false;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

const validateReportData = (data: any) => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string' || data.title.length < 5 || data.title.length > 200) {
    errors.push('Title must be between 5 and 200 characters');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.length < 20 || data.description.length > 5000) {
    errors.push('Description must be between 20 and 5000 characters');
  }

  if (!data.location || typeof data.location !== 'string' || data.location.length < 5 || data.location.length > 200) {
    errors.push('Location must be between 5 and 200 characters');
  }

  if (!['low', 'medium', 'high', 'critical', 'urgent'].includes(data.priority)) {
    errors.push('Invalid priority level');
  }

  if (!data.category || typeof data.category !== 'string' || data.category.length < 3 || data.category.length > 50) {
    errors.push('Category must be between 3 and 50 characters');
  }

  if (data.coordinates && !isValidCoordinates(data.coordinates)) {
    errors.push('Coordinates must be in "lat,lon" format with valid ranges');
  }

  return errors;
};

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateCheck = checkRateLimit(clientIP);
    
    if (!rateCheck.allowed) {
      // Must consume the body to prevent resource leaks
      await req.text();
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateCheck.retryAfter?.toString() || '300'
          } 
        }
      );
    }

    // Read body as text FIRST to enforce size limit before parsing
    const bodyText = await req.text();
    if (bodyText.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestData: any;
    try {
      requestData = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use ANON key + user token for auth verification and RLS-enforced insert
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User-scoped client for auth + insert (RLS enforced)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeInput(requestData.title),
      description: sanitizeInput(requestData.description),
      location: sanitizeInput(requestData.location),
      priority: requestData.priority,
      category: sanitizeInput(requestData.category),
      coordinates: requestData.coordinates || null,
      photo_urls: Array.isArray(requestData.photo_urls) ? 
        requestData.photo_urls.slice(0, 10).map((url: string) => sanitizeInput(String(url))) : [],
      video_urls: Array.isArray(requestData.video_urls) ? 
        requestData.video_urls.slice(0, 5).map((url: string) => sanitizeInput(String(url))) : []
    };

    // Validate coordinates if provided
    if (sanitizedData.coordinates && !isValidCoordinates(sanitizedData.coordinates)) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: ['Invalid coordinates format'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate data
    const validationErrors = validateReportData(sanitizedData);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create problem report using USER-SCOPED client (RLS enforced)
    const { data: report, error: insertError } = await supabaseUser
      .from('problem_reports')
      .insert({
        ...sanitizedData,
        reported_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful submission
    console.log(`Report submitted successfully: ${report.id} by user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_id: report.id,
        remainingRequests: rateCheck.remainingRequests 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});