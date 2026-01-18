import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// UUID validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
  
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    return { valid: false, error: 'Invalid priority' };
  }
  
  if (data.location && (typeof data.location !== 'string' || data.location.length > 500)) {
    return { valid: false, error: 'Location must be a string under 500 characters' };
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

    // Check content length
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 51200) { // 50KB limit
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

    const reportData = await req.json()

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

    // Insert the problem report with sanitized data
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

    // Create notification for user
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Report Submitted Successfully',
        message: `Your report "${sanitizedTitle}" has been submitted for review.`,
        type: 'success',
        category: 'report'
      })

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
