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

const MAX_BODY_SIZE = 51200; // 50KB

/**
 * Robust input sanitization — decode HTML entities, strip all tags,
 * remove dangerous URI schemes, event handlers, and null bytes.
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input;

  // 1. Decode HTML entities to catch encoded payloads
  cleaned = cleaned
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'");

  // 2. Remove ALL HTML/XML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // 3. Remove dangerous URI schemes
  cleaned = cleaned.replace(/\b(javascript|data|vbscript)\s*:/gi, '');

  // 4. Remove event handler patterns
  cleaned = cleaned.replace(/\bon\w+\s*=/gi, '');

  // 5. Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // 6. Limit length
  cleaned = cleaned.trim().slice(0, 10000);

  return cleaned;
}

// UUID validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate bid data
function validateBidData(data: any): { valid: boolean; error?: string } {
  if (!data.reportId || typeof data.reportId !== 'string') {
    return { valid: false, error: 'Report ID is required' };
  }
  if (!isValidUUID(data.reportId)) {
    return { valid: false, error: 'Invalid report ID format' };
  }
  
  if (data.bidAmount === undefined || data.bidAmount === null) {
    return { valid: false, error: 'Bid amount is required' };
  }
  const bidAmount = Number(data.bidAmount);
  if (isNaN(bidAmount) || bidAmount <= 0 || bidAmount > 1e12) {
    return { valid: false, error: 'Bid amount must be a positive number (max 1 trillion)' };
  }
  
  if (!data.proposal || typeof data.proposal !== 'string') {
    return { valid: false, error: 'Proposal is required' };
  }
  if (data.proposal.length < 20 || data.proposal.length > 5000) {
    return { valid: false, error: 'Proposal must be between 20 and 5000 characters' };
  }
  
  if (data.estimatedDuration === undefined || data.estimatedDuration === null) {
    return { valid: false, error: 'Estimated duration is required' };
  }
  const duration = Number(data.estimatedDuration);
  if (isNaN(duration) || !Number.isInteger(duration) || duration <= 0 || duration > 365) {
    return { valid: false, error: 'Duration must be a whole number between 1 and 365 days' };
  }

  // Validate optional technical_approach
  if (data.technicalApproach !== undefined && data.technicalApproach !== null) {
    if (typeof data.technicalApproach !== 'string' || data.technicalApproach.length > 10000) {
      return { valid: false, error: 'Technical approach must be a string under 10000 characters' };
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
      await req.text(); // consume body to prevent leaks
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

    // Read body as text first to enforce size limit before JSON.parse
    const bodyText = await req.text();
    if (bodyText.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let bidData: any;
    try {
      bidData = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // User-scoped client for RLS-enforced operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is a contractor
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'contractor') {
      return new Response(
        JSON.stringify({ error: 'Only contractors can submit bids' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    const validation = validateBidData(bidData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin client for service-level queries (report status check, notifications)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify report exists and bidding is open
    const { data: report, error: reportError } = await supabaseAdmin
      .from('problem_reports')
      .select('id, title, reported_by, bidding_status, bidding_end_date, status, deleted_at')
      .eq('id', bidData.reportId)
      .single()

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (report.deleted_at) {
      return new Response(
        JSON.stringify({ error: 'Report has been deleted' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (report.bidding_status !== 'open') {
      return new Response(
        JSON.stringify({ error: 'Bidding is not open for this report' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check bidding window hasn't expired
    if (report.bidding_end_date && new Date(report.bidding_end_date) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Bidding window has closed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for duplicate bid from same contractor on same report
    const { data: existingBid } = await supabaseAdmin
      .from('contractor_bids')
      .select('id')
      .eq('report_id', bidData.reportId)
      .eq('contractor_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingBid) {
      return new Response(
        JSON.stringify({ error: 'You have already submitted a bid for this report' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize text inputs
    const sanitizedProposal = sanitizeInput(bidData.proposal);
    const sanitizedTechnicalApproach = bidData.technicalApproach 
      ? sanitizeInput(bidData.technicalApproach) 
      : null;

    // Re-validate sanitized proposal length
    if (sanitizedProposal.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Proposal contains too much invalid content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert the contractor bid using user-scoped client (RLS enforced)
    // DB unique index idx_unique_active_bid_per_contractor_report prevents duplicates
    const { data: bid, error: bidError } = await supabaseClient
      .from('contractor_bids')
      .insert({
        report_id: bidData.reportId,
        contractor_id: user.id,
        bid_amount: Number(bidData.bidAmount),
        proposal: sanitizedProposal,
        estimated_duration: Number(bidData.estimatedDuration),
        technical_approach: sanitizedTechnicalApproach,
      })
      .select()
      .single()

    if (bidError) {
      // RACE CONDITION FIX: Catch unique constraint violation from concurrent inserts
      if (bidError.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'You have already submitted a bid for this report' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.error('Database error:', bidError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit bid' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Notifications ---
    const { data: contractorProfile } = await supabaseAdmin
      .from('contractor_profiles')
      .select('company_name')
      .eq('user_id', user.id)
      .single()

    const companyName = contractorProfile?.company_name || 'A contractor'
    const projectTitle = sanitizeInput(String(report.title || 'a project').slice(0, 100))
    const bidAmountFormatted = Number(bidData.bidAmount).toLocaleString()

    // 1. Confirmation notification for the contractor
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Bid Submitted Successfully',
        message: `Your bid of KES ${bidAmountFormatted} for "${projectTitle}" has been submitted.`,
        type: 'success',
        category: 'bid',
        action_url: '/contractor/tracking'
      })

    // 2. Notify the citizen who reported the issue
    if (report.reported_by) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: report.reported_by,
          title: 'New Bid on Your Report',
          message: `${companyName} submitted a bid of KES ${bidAmountFormatted} for "${projectTitle}"`,
          type: 'info',
          category: 'bid',
          action_url: '/citizen/track-reports'
        })
    }

    // 3. Notify government officials
    const { data: govUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('user_type', 'government')
      .limit(10)

    if (govUsers && govUsers.length > 0) {
      const govNotifications = govUsers.map(gov => ({
        user_id: gov.user_id,
        title: 'New Contractor Bid',
        message: `${companyName} bid KES ${bidAmountFormatted} for "${projectTitle}"`,
        type: 'info',
        category: 'bid',
        action_url: '/government/bid-approval',
        read: false
      }))
      
      await supabaseAdmin
        .from('notifications')
        .insert(govNotifications)
    }

    console.log(`Bid submitted: ${bid.id} by ${companyName} for report ${bidData.reportId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        bid,
        message: 'Bid submitted successfully' 
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