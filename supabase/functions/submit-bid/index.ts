
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is a contractor
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || profile.user_type !== 'contractor') {
      return new Response(
        JSON.stringify({ error: 'Only contractors can submit bids' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const bidData = await req.json()

    // Insert the contractor bid
    const { data: bid, error: bidError } = await supabaseClient
      .from('contractor_bids')
      .insert({
        report_id: bidData.reportId,
        contractor_id: user.id,
        bid_amount: bidData.bidAmount,
        proposal: bidData.proposal,
        estimated_duration: bidData.estimatedDuration
      })
      .select()
      .single()

    if (bidError) {
      throw bidError
    }

    // Create notification
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Bid Submitted Successfully',
        message: `Your bid for "${bidData.projectTitle}" has been submitted.`,
        type: 'success',
        category: 'project'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        bid,
        message: 'Bid submitted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
