import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientIP: string, maxRequests = 10, windowMs = 60000): { allowed: boolean; retryAfter?: number } {
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

// Max body size: 50KB
const MAX_BODY_SIZE = 51200;

/**
 * Robust input sanitization using allowlist approach.
 * Strips ALL HTML tags, decodes HTML entities, removes dangerous URI schemes.
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input;

  // 1. Decode HTML entities to catch encoded payloads like &#x6A;avascript:
  cleaned = cleaned
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
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

  // 6. Limit length to prevent storage abuse
  cleaned = cleaned.trim().slice(0, 10000);

  return cleaned;
}

// Validate coordinate string format: "lat,lon"
function isValidCoordinates(coords: string): boolean {
  if (typeof coords !== 'string') return false;
  const parts = coords.split(',').map(s => s.trim());
  if (parts.length !== 2) return false;
  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Validate report data
function validateReportData(data: any): { valid: boolean; error?: string } {
  if (!data.title || typeof data.title !== 'string') {
    return { valid: false, error: 'Title is required' };
  }
  if (data.title.length < 5 || data.title.length > 200) {
    return { valid: false, error: 'Title must be between 5 and 200 characters' };
  }
  
  if (!data.description || typeof data.description !== 'string') {
    return { valid: false, error: 'Description is required' };
  }
  if (data.description.length < 20 || data.description.length > 5000) {
    return { valid: false, error: 'Description must be between 20 and 5000 characters' };
  }
  
  const validCategories = ['roads', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'security', 'environment', 'other'];
  if (data.category && !validCategories.includes(data.category)) {
    return { valid: false, error: 'Invalid category' };
  }
  
  const validPriorities = ['low', 'medium', 'high', 'critical', 'urgent'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    return { valid: false, error: 'Invalid priority' };
  }
  
  if (data.location && (typeof data.location !== 'string' || data.location.length > 500)) {
    return { valid: false, error: 'Location must be a string under 500 characters' };
  }

  if (data.coordinates && !isValidCoordinates(data.coordinates)) {
    return { valid: false, error: 'Coordinates must be in "lat,lon" format with valid ranges' };
  }
  
  if (data.estimatedCost !== undefined) {
    const cost = Number(data.estimatedCost);
    if (isNaN(cost) || cost < 0 || cost > 1e12) {
      return { valid: false, error: 'Invalid estimated cost' };
    }
  }
  
  if (data.affectedPopulation !== undefined) {
    const pop = Number(data.affectedPopulation);
    if (isNaN(pop) || pop < 0 || pop > 1e9) {
      return { valid: false, error: 'Invalid affected population' };
    }
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Check rate limit
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
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

    // Check content length BEFORE parsing body
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      // Consume the body to prevent resource leaks
      await req.text();
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Read body as text first to enforce size limit regardless of header
    const bodyText = await req.text();
    if (bodyText.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let reportData: any;
    try {
      reportData = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auth check: create user-scoped client (NOT service role) for the insert
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

    // Validate input
    const validation = validateReportData(reportData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(reportData.title);
    const sanitizedDescription = sanitizeInput(reportData.description);
    const sanitizedLocation = reportData.location ? sanitizeInput(reportData.location) : null;

    // Re-validate sanitized title/description lengths (sanitization may shorten them)
    if (sanitizedTitle.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Title contains too much invalid content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (sanitizedDescription.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Description contains too much invalid content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert the problem report using user-scoped client (RLS enforced)
    const { data: report, error: reportError } = await supabaseClient
      .from('problem_reports')
      .insert({
        title: sanitizedTitle,
        description: sanitizedDescription,
        category: reportData.category || 'other',
        priority: reportData.priority || 'medium',
        location: sanitizedLocation,
        coordinates: reportData.coordinates || null,
        estimated_cost: reportData.estimatedCost ? Number(reportData.estimatedCost) : null,
        affected_population: reportData.affectedPopulation ? Number(reportData.affectedPopulation) : null,
        reported_by: user.id
      })
      .select()
      .single()

    if (reportError) {
      console.error('Database error:', reportError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification using service role (needs to bypass RLS for gov notifications)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Report Submitted Successfully',
        message: `Your report "${sanitizedTitle}" has been submitted for review.`,
        type: 'success',
        category: 'report'
      })

    // Notify government users
    const { data: govUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('user_type', 'government')
      .limit(20)

    if (govUsers && govUsers.length > 0) {
      const govNotifications = govUsers.map(gov => ({
        user_id: gov.user_id,
        title: 'New Problem Report',
        message: `A citizen reported: "${sanitizedTitle}" at ${sanitizedLocation || 'Unknown location'}. Requires review.`,
        type: 'info',
        category: 'report',
        action_url: '/government/reports'
      }))
      await supabaseAdmin.from('notifications').insert(govNotifications)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        message: 'Report submitted successfully' 
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