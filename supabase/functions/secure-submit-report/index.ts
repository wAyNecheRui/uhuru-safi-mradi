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

const sanitizeInput = (input: string): string => {
  if (!input) return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 10000); // Prevent DoS
};

const validateReportData = (data: any) => {
  const errors: string[] = [];

  if (!data.title || data.title.length < 5 || data.title.length > 200) {
    errors.push('Title must be between 5 and 200 characters');
  }

  if (!data.description || data.description.length < 20 || data.description.length > 2000) {
    errors.push('Description must be between 20 and 2000 characters');
  }

  if (!data.location || data.location.length < 5 || data.location.length > 200) {
    errors.push('Location must be between 5 and 200 characters');
  }

  if (!['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
    errors.push('Invalid priority level');
  }

  if (!data.category || data.category.length < 3 || data.category.length > 50) {
    errors.push('Category must be between 3 and 50 characters');
  }

  return errors;
};

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const requestData = await req.json();
    
    // Validate input length to prevent DoS
    const bodyString = JSON.stringify(requestData);
    if (bodyString.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeInput(requestData.title),
      description: sanitizeInput(requestData.description),
      location: sanitizeInput(requestData.location),
      priority: requestData.priority,
      category: sanitizeInput(requestData.category),
      coordinates: requestData.coordinates,
      photo_urls: Array.isArray(requestData.photo_urls) ? 
        requestData.photo_urls.slice(0, 10).map((url: string) => sanitizeInput(url)) : [],
      video_urls: Array.isArray(requestData.video_urls) ? 
        requestData.video_urls.slice(0, 5).map((url: string) => sanitizeInput(url)) : []
    };

    // Validate data
    const validationErrors = validateReportData(sanitizedData);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create problem report with user ID
    const { data: report, error: insertError } = await supabase
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

    // Log successful submission for monitoring
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