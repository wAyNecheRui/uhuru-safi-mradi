
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

    const { milestoneId } = await req.json()

    // Verify user has permission (government users only)
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Only government users can release payments' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get milestone details
    const { data: milestone, error: milestoneError } = await supabaseClient
      .from('project_milestones')
      .select('*, project_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return new Response(
        JSON.stringify({ error: 'Milestone not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get escrow account
    const { data: escrow, error: escrowError } = await supabaseClient
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', milestone.project_id)
      .single()

    if (escrowError || !escrow) {
      return new Response(
        JSON.stringify({ error: 'Escrow account not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate milestone amount
    const milestoneAmount = (escrow.total_amount * milestone.payment_percentage) / 100

    // Create payment transaction
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        milestone_id: milestoneId,
        amount: milestoneAmount,
        transaction_type: 'release',
        payment_method: 'mpesa',
        status: 'completed'
      })
      .select()
      .single()

    if (transactionError) {
      throw transactionError
    }

    // Update milestone status
    await supabaseClient
      .from('project_milestones')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .eq('id', milestoneId)

    // Update escrow account
    await supabaseClient
      .from('escrow_accounts')
      .update({
        released_amount: escrow.released_amount + milestoneAmount,
        held_amount: escrow.held_amount - milestoneAmount
      })
      .eq('id', escrow.id)

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Milestone Payment Released',
        message: `Payment of KES ${milestoneAmount.toLocaleString()} released for "${milestone.title}".`,
        type: 'success',
        category: 'payment'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction,
        message: 'Milestone payment released successfully' 
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
