import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
}

const MAX_BODY_SIZE = 51200;

// SECURITY: Strict Zod schema for input validation
const ReleaseMilestoneSchema = z.object({
  milestoneId: z.string().uuid({ message: 'milestoneId must be a valid UUID' }),
});

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

    // SECURITY: Milestone status guard — only allow release for 'verified' or 'submitted' milestones
    const RELEASABLE_STATUSES = ['verified', 'submitted'];
    if (!RELEASABLE_STATUSES.includes(milestone.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot release payment: milestone status is '${milestone.status}'. Must be verified or submitted.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RACE CONDITION FIX: Atomically lock milestone status FIRST before any payment logic.
    // This prevents two concurrent requests from both passing the status check above.
    const { data: lockedMilestone, error: lockError } = await supabaseAdmin
      .from('project_milestones')
      .update({ 
        status: 'payment_processing',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .eq('id', milestoneId)
      .eq('status', milestone.status) // Optimistic lock: only succeeds if status hasn't changed
      .select('id')
      .single()

    if (lockError || !lockedMilestone) {
      console.warn(`[RELEASE] Milestone ${milestoneId} status lock failed — concurrent request likely won`)
      return new Response(
        JSON.stringify({ error: 'Payment already being processed for this milestone' }),
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
      // Rollback milestone status
      await supabaseAdmin.from('project_milestones').update({ status: milestone.status }).eq('id', milestoneId)
      return new Response(
        JSON.stringify({ error: 'Escrow account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate milestone amount
    const milestoneAmount = (escrow.total_amount * milestone.payment_percentage) / 100

    // SECURITY: Insufficient funds check
    if (escrow.held_amount < milestoneAmount) {
      // Rollback milestone status
      await supabaseAdmin.from('project_milestones').update({ status: milestone.status }).eq('id', milestoneId)
      return new Response(
        JSON.stringify({ error: `Insufficient escrow funds: need ${milestoneAmount}, have ${escrow.held_amount}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RACE CONDITION FIX: Optimistic lock on escrow balance BEFORE creating payment
    const { data: lockedEscrow, error: escrowLockError } = await supabaseAdmin
      .from('escrow_accounts')
      .update({
        released_amount: escrow.released_amount + milestoneAmount,
        held_amount: escrow.held_amount - milestoneAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)
      .eq('held_amount', escrow.held_amount) // Optimistic lock: prevents concurrent overdraw
      .select('id')
      .single()

    if (escrowLockError || !lockedEscrow) {
      // Rollback milestone status
      await supabaseAdmin.from('project_milestones').update({ status: milestone.status }).eq('id', milestoneId)
      console.error('[RELEASE] Escrow balance lock failed — concurrent modification detected')
      return new Response(
        JSON.stringify({ error: 'Escrow balance changed during processing. Please retry.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentRef = generateDemoPaymentRef();

    // Create payment transaction — DB unique index prevents duplicates
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
      // Check if it's a duplicate constraint violation
      if (transactionError.code === '23505') {
        // Milestone already paid — set status to paid (idempotent)
        await supabaseAdmin.from('project_milestones').update({ status: 'paid' }).eq('id', milestoneId)
        return new Response(
          JSON.stringify({ error: 'Payment already released for this milestone' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Rollback escrow and milestone on other errors
      await supabaseAdmin.from('escrow_accounts').update({
        released_amount: escrow.released_amount,
        held_amount: escrow.held_amount
      }).eq('id', escrow.id)
      await supabaseAdmin.from('project_milestones').update({ status: milestone.status }).eq('id', milestoneId)
      console.error('[RELEASE] Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Finalize milestone status to 'paid'
    await supabaseAdmin
      .from('project_milestones')
      .update({ status: 'paid' })
      .eq('id', milestoneId)

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