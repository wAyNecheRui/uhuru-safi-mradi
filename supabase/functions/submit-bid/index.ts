import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (isNaN(duration) || duration <= 0 || duration > 365) {
    return { valid: false, error: 'Duration must be between 1 and 365 days' };
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

    // Create admin client for notifications (service role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

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

    // Verify user is a contractor
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile.user_type !== 'contractor') {
      return new Response(
        JSON.stringify({ error: 'Only contractors can submit bids' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bidData = await req.json()

    // Validate input
    const validation = validateBidData(bidData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize text inputs
    const sanitizedProposal = sanitizeInput(bidData.proposal);

    // Insert the contractor bid with validated and sanitized data
    const { data: bid, error: bidError } = await supabaseClient
      .from('contractor_bids')
      .insert({
        report_id: bidData.reportId,
        contractor_id: user.id,
        bid_amount: Number(bidData.bidAmount),
        proposal: sanitizedProposal,
        estimated_duration: Number(bidData.estimatedDuration)
      })
      .select()
      .single()

    if (bidError) {
      console.error('Database error:', bidError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit bid' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get report details for notifications
    const { data: report } = await supabaseAdmin
      .from('problem_reports')
      .select('reported_by, title')
      .eq('id', bidData.reportId)
      .single()

    // Get contractor company name
    const { data: contractorProfile } = await supabaseAdmin
      .from('contractor_profiles')
      .select('company_name')
      .eq('user_id', user.id)
      .single()

    const companyName = contractorProfile?.company_name || 'A contractor'
    const projectTitle = report?.title ? String(report.title).slice(0, 100) : (bidData.projectTitle ? sanitizeInput(String(bidData.projectTitle).slice(0, 100)) : 'a project')
    const bidAmountFormatted = Number(bidData.bidAmount).toLocaleString()

    // Notification for the contractor (confirmation)
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: '✅ Bid Submitted Successfully',
        message: `Your bid of KES ${bidAmountFormatted} for "${projectTitle}" has been submitted.`,
        type: 'success',
        category: 'bid'
      })

    // Notify the citizen who reported the issue
    if (report?.reported_by) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: report.reported_by,
          title: '📋 New Bid on Your Report',
          message: `${companyName} submitted a bid of KES ${bidAmountFormatted} for "${projectTitle}"`,
          type: 'info',
          category: 'bid',
          action_url: '/citizen/track-reports'
        })
    }

    // Notify government officials
    const { data: govUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('user_type', 'government')
      .limit(10)

    if (govUsers && govUsers.length > 0) {
      const govNotifications = govUsers.map(gov => ({
        user_id: gov.user_id,
        title: '📋 New Contractor Bid',
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
