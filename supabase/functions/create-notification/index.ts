import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://esm.sh/zod@3.23.8"

// SECURITY: Strict input schema (Phase 7 hardening)
const NotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  userIds: z.array(z.string().uuid()).max(500).optional(),
  targetRole: z.enum(['citizen', 'contractor', 'government', 'all']).optional(),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  type: z.enum(['info', 'success', 'warning', 'error']),
  category: z.string().trim().min(1).max(50),
  actionUrl: z.string().trim().max(500).optional(),
}).refine(
  (d) => !!d.userId || (!!d.userIds && d.userIds.length > 0) || !!d.targetRole,
  { message: 'Must specify userId, userIds, or targetRole' }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
}

interface NotificationPayload {
  userId?: string;
  userIds?: string[];
  targetRole?: 'citizen' | 'contractor' | 'government' | 'all';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  actionUrl?: string;
}

const ALLOWED_TYPES = ['info', 'success', 'warning', 'error'];
const ALLOWED_CATEGORIES = [
  'report', 'project', 'payment', 'verification', 'system',
  'bid', 'bidding', 'milestone', 'escrow', 'vote', 'issue', 'rating', 'workforce', 'general'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const MAX_BODY_SIZE = 51200; // 50KB

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller is authenticated using getClaims
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      // Consume body to prevent resource leaks
      await req.text().catch(() => {});
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token)

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = claimsData.claims.sub

    // Rate limit: max 50 notification requests per minute per user
    const { data: rateLimitAllowed } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: `notif:${callerId}`,
      p_max_requests: 50,
      p_window_seconds: 60
    })

    if (rateLimitAllowed === false) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Read body as text first to enforce size limit and handle malformed JSON
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let rawPayload: any;
    try {
      rawPayload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const parsedPayload = NotificationSchema.safeParse(rawPayload);
    if (!parsedPayload.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: parsedPayload.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const payload: NotificationPayload = parsedPayload.data;

    // Normalize category to allowlist
    const category = ALLOWED_CATEGORIES.includes(payload.category) ? payload.category : 'general';

    // Determine target users
    let targetUserIds: string[] = []

    if (payload.userId) {
      targetUserIds = [payload.userId]
    } else if (payload.userIds && Array.isArray(payload.userIds) && payload.userIds.length > 0) {
      // Cap at 500 users per request
      targetUserIds = payload.userIds.slice(0, 500)
    } else if (payload.targetRole) {
      if (payload.targetRole === 'all') {
        const { data: allUsers } = await supabaseAdmin
          .from('user_profiles')
          .select('user_id')
          .limit(1000)
        targetUserIds = allUsers?.map(u => u.user_id) || []
      } else {
        const { data: roleUsers } = await supabaseAdmin
          .from('user_profiles')
          .select('user_id')
          .eq('user_type', payload.targetRole)
          .limit(500)
        targetUserIds = roleUsers?.map(u => u.user_id) || []
      }
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No target users specified or found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate all user IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    targetUserIds = targetUserIds.filter(id => uuidRegex.test(id));

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid user IDs provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification records
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title: payload.title.slice(0, 200),
      message: payload.message.slice(0, 2000),
      type: payload.type,
      category,
      action_url: payload.actionUrl?.slice(0, 500) || null,
      read: false
    }))

    const { data: insertedNotifications, error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select('id, user_id, title, type, category, created_at')

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Created ${insertedNotifications?.length || 0} notifications for category: ${category}`)

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedNotifications?.length || 0,
        notifications: insertedNotifications
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})