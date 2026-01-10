import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Demo mode - generate simulated payment reference
function generateDemoPaymentRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `PAY${timestamp}${random}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Use anon key for user auth verification
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

    console.log(`[RELEASE-DEMO] Processing milestone payment release: ${milestoneId}, user: ${user.id}`)

    // Verify user has permission (government users only) - use admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type, full_name')
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

    // Get milestone details - use admin client
    const { data: milestone, error: milestoneError } = await supabaseAdmin
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

    // Get escrow account - use admin client
    const { data: escrow, error: escrowError } = await supabaseAdmin
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
    const paymentRef = generateDemoPaymentRef();

    console.log(`[RELEASE-DEMO] Demo mode - releasing KES ${milestoneAmount} for milestone ${milestoneId}`)

    // Create payment transaction - use admin client
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        milestone_id: milestoneId,
        amount: milestoneAmount,
        transaction_type: 'release',
        payment_method: 'mpesa_demo',
        status: 'completed',
        stripe_transaction_id: paymentRef
      })
      .select()
      .single()

    if (transactionError) {
      throw transactionError
    }

    // Update milestone status - use admin client
    await supabaseAdmin
      .from('project_milestones')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .eq('id', milestoneId)

    // Update escrow account - use admin client
    await supabaseAdmin
      .from('escrow_accounts')
      .update({
        released_amount: escrow.released_amount + milestoneAmount,
        held_amount: escrow.held_amount - milestoneAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    // Create notification - use admin client
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Milestone Payment Released',
        message: `Demo: KES ${milestoneAmount.toLocaleString()} released for "${milestone.title}". Ref: ${paymentRef}`,
        type: 'success',
        category: 'payment'
      })

    // Create realtime update
    await supabaseAdmin
      .from('realtime_project_updates')
      .insert({
        project_id: milestone.project_id,
        update_type: 'payment_released',
        message: `Demo: Payment of KES ${milestoneAmount.toLocaleString()} released for "${milestone.title}"`,
        created_by: user.id,
        metadata: {
          milestone_id: milestoneId,
          amount: milestoneAmount,
          reference: paymentRef,
          demo_mode: true
        }
      })

    console.log(`[RELEASE-DEMO] Payment released successfully. Transaction ID: ${transaction.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        demo_mode: true,
        transaction: {
          ...transaction,
          reference: paymentRef
        },
        message: 'Milestone payment released successfully (Demo Mode)' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[RELEASE-DEMO] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
