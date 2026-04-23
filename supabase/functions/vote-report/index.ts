import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://esm.sh/zod@3.23.8"

// SECURITY: Strict input schema (Phase 7 hardening)
const VoteSchema = z.object({
  reportId: z.string().uuid(),
  voteType: z.enum(['upvote', 'downvote']),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
}

// UUID validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate vote data
function validateVoteData(data: any): { valid: boolean; error?: string } {
  if (!data.reportId || typeof data.reportId !== 'string') {
    return { valid: false, error: 'Report ID is required' };
  }
  if (!isValidUUID(data.reportId)) {
    return { valid: false, error: 'Invalid report ID format' };
  }
  
  if (!data.voteType || typeof data.voteType !== 'string') {
    return { valid: false, error: 'Vote type is required' };
  }
  
  const validVoteTypes = ['upvote', 'downvote'];
  if (!validVoteTypes.includes(data.voteType)) {
    return { valid: false, error: 'Invalid vote type. Must be "upvote" or "downvote"' };
  }
  
  return { valid: true };
}

const MAX_BODY_SIZE = 10240; // 10KB — vote payloads are tiny

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Create admin client for DB-backed rate limiting
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // DB-backed rate limiting (shared across all function instances)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const { data: rateLimitAllowed } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: `vote:${clientIP}`,
      p_max_requests: 30,
      p_window_seconds: 60
    })
    if (rateLimitAllowed === false) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

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

    // SECURITY: Body size validation before parsing
    const rawBody = await req.text()
    if (rawBody.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let voteData: any
    try {
      voteData = JSON.parse(rawBody)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input via Zod (replaces legacy validateVoteData)
    const parsedVote = VoteSchema.safeParse(voteData);
    if (!parsedVote.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: parsedVote.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { reportId, voteType } = parsedVote.data;

    // Verify report exists
    const { data: report, error: reportError } = await supabaseClient
      .from('problem_reports')
      .select('id')
      .eq('id', reportId)
      .is('deleted_at', null)
      .single()

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert vote (insert or update if exists)
    const { data: vote, error: voteError } = await supabaseClient
      .from('community_votes')
      .upsert({
        report_id: reportId,
        user_id: user.id,
        vote_type: voteType
      })
      .select()
      .single()

    if (voteError) {
      console.error('Database error:', voteError);
      return new Response(
        JSON.stringify({ error: 'Failed to record vote' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get updated vote counts
    const { data: voteCounts, error: countError } = await supabaseClient
      .from('community_votes')
      .select('vote_type')
      .eq('report_id', reportId)

    if (countError) {
      console.error('Error getting vote counts:', countError);
    }

    const upvotes = voteCounts?.filter(v => v.vote_type === 'upvote').length || 0;
    const downvotes = voteCounts?.filter(v => v.vote_type === 'downvote').length || 0;

    return new Response(
      JSON.stringify({ 
        success: true, 
        vote,
        upvotes,
        downvotes,
        message: 'Vote recorded successfully' 
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
