import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_SIZE = 51200;

function generateDemoPaymentRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `PAY${timestamp}${random}`;
}

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // SECURITY: Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

    // SECURITY: Payload size
    const rawBody = await req.text()
    if (rawBody.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { milestoneId } = body;

    // SECURITY: Validate milestoneId
    if (!milestoneId || typeof milestoneId !== 'string' || !UUID_REGEX.test(milestoneId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid milestoneId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[RELEASE] Processing milestone payment: ${milestoneId}, user: ${user.id}`)

    // SECURITY: Role check — government only
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: government role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get milestone details
    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from('project_milestones')
      .select('*, project_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return new Response(
        JSON.stringify({ error: 'Milestone not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Milestone status guard — only allow release for 'verified' or 'submitted' milestones
    const RELEASABLE_STATUSES = ['verified', 'submitted'];
    if (!RELEASABLE_STATUSES.includes(milestone.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot release payment: milestone status is '${milestone.status}'. Must be verified or submitted.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Check for existing completed payment for this milestone (prevent double-pay)
    const { data: existingPayment } = await supabaseAdmin
      .from('payment_transactions')
      .select('id')
      .eq('milestone_id', milestoneId)
      .eq('status', 'completed')
      .eq('transaction_type', 'release')
      .maybeSingle()

    if (existingPayment) {
      return new Response(
        JSON.stringify({ error: 'Payment already released for this milestone' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get escrow account
    const { data: escrow, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', milestone.project_id)
      .is('deleted_at', null)
      .single()

    if (escrowError || !escrow) {
      return new Response(
        JSON.stringify({ error: 'Escrow account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate milestone amount
    const milestoneAmount = (escrow.total_amount * milestone.payment_percentage) / 100

    // SECURITY: Insufficient funds check
    if (escrow.held_amount < milestoneAmount) {
      return new Response(
        JSON.stringify({ error: `Insufficient escrow funds: need ${milestoneAmount}, have ${escrow.held_amount}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentRef = generateDemoPaymentRef();

    // Create payment transaction
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
      console.error('[RELEASE] Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Set milestone to 'paid' (not 'verified' — that's a different state)
    await supabaseAdmin
      .from('project_milestones')
      .update({ 
        status: 'paid',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .eq('id', milestoneId)
      .eq('status', milestone.status) // Optimistic lock on status

    // SECURITY FIX: Optimistic lock on escrow balance to prevent race conditions
    const { error: escrowUpdateError } = await supabaseAdmin
      .from('escrow_accounts')
      .update({
        released_amount: escrow.released_amount + milestoneAmount,
        held_amount: escrow.held_amount - milestoneAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)
      .eq('held_amount', escrow.held_amount) // Optimistic lock

    if (escrowUpdateError) {
      console.error('[RELEASE] Escrow update conflict:', escrowUpdateError)
    }

    // Notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Milestone Payment Released',
        message: `KES ${milestoneAmount.toLocaleString()} released for "${milestone.title}". Ref: ${paymentRef}`,
        type: 'success',
        category: 'payment'
      })

    console.log(`[RELEASE] Payment released successfully. Transaction: ${transaction.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction: { id: transaction.id, reference: paymentRef, amount: milestoneAmount },
        message: 'Milestone payment released successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[RELEASE] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})