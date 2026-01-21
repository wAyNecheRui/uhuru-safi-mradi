import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role for inserting notifications
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create user client to verify auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: NotificationPayload = await req.json()

    // Validate required fields
    if (!payload.title || !payload.message || !payload.type || !payload.category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, message, type, category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine target users
    let targetUserIds: string[] = []

    if (payload.userId) {
      targetUserIds = [payload.userId]
    } else if (payload.userIds && payload.userIds.length > 0) {
      targetUserIds = payload.userIds
    } else if (payload.targetRole) {
      // Fetch users by role
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

    // Create notification records for each user
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      category: payload.category,
      action_url: payload.actionUrl || null,
      read: false
    }))

    // Batch insert notifications (Supabase handles this efficiently)
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

    console.log(`Created ${insertedNotifications?.length || 0} notifications for category: ${payload.category}`)

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
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
