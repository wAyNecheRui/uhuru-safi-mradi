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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_SIZE = 51200;

function generateDemoB2CTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `B2C${timestamp}${random}`;
}

function simulateB2CPayment(amount: number, contractorName: string, contractorPhone: string) {
  const transactionId = generateDemoB2CTransactionId();
  return {
    ConversationID: `AG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    OriginatorConversationID: `OC_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Accept the service request successfully.',
    TransactionID: transactionId,
    TransactionAmount: amount,
    ReceiverPartyPublicName: `${contractorPhone} - ${contractorName}`,
    TransactionCompletedDateTime: new Date().toISOString(),
    ResultCode: '0',
    ResultDesc: 'The service request is processed successfully.',
    _demo: true,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: Reject non-POST
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

    const { milestone_id, contractor_phone } = body;

    // SECURITY: Validate milestone_id
    if (!milestone_id || typeof milestone_id !== 'string' || !UUID_REGEX.test(milestone_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid milestone_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[B2C] Processing contractor payment for milestone: ${milestone_id}`)

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
      .eq('id', milestone_id)
      .single()

    if (milestoneError || !milestone) {
      return new Response(
        JSON.stringify({ error: 'Milestone not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Milestone status guard — only verified/submitted milestones can be paid
    const PAYABLE_STATUSES = ['verified', 'submitted'];
    if (!PAYABLE_STATUSES.includes(milestone.status)) {
      return new Response(
        JSON.stringify({ error: `Cannot pay: milestone status is '${milestone.status}'. Must be verified or submitted.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Prevent duplicate payment
    const { data: existingPayment } = await supabaseAdmin
      .from('payment_transactions')
      .select('id')
      .eq('milestone_id', milestone_id)
      .eq('status', 'completed')
      .eq('transaction_type', 'release')
      .maybeSingle()

    if (existingPayment) {
      return new Response(
        JSON.stringify({ error: 'Payment already completed for this milestone' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check citizen verifications
    const { data: verifications } = await supabaseAdmin
      .from('milestone_verifications')
      .select('*')
      .eq('milestone_id', milestone_id)

    const approvedVerifications = verifications?.filter(v => v.verification_status === 'approved') || []
    const citizenVerificationCount = approvedVerifications.length

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

    const milestoneAmount = (escrow.total_amount * milestone.payment_percentage) / 100

    // SECURITY: Insufficient funds check
    if (escrow.held_amount < milestoneAmount) {
      return new Response(
        JSON.stringify({ error: `Insufficient funds: need ${milestoneAmount}, have ${escrow.held_amount}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get contractor details
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('contractor_id, title')
      .eq('id', milestone.project_id)
      .single()

    let contractorName = 'Contractor'
    let contractorPhoneNumber = contractor_phone || '254700000000'

    if (project?.contractor_id) {
      const { data: contractorProfile } = await supabaseAdmin
        .from('contractor_profiles')
        .select('company_name')
        .eq('user_id', project.contractor_id)
        .single()
      
      if (contractorProfile) contractorName = contractorProfile.company_name

      const { data: contractorUser } = await supabaseAdmin
        .from('user_profiles')
        .select('phone_number')
        .eq('user_id', project.contractor_id)
        .single()
      
      if (contractorUser?.phone_number && !contractor_phone) {
        contractorPhoneNumber = contractorUser.phone_number
      }
    }

    // Simulate B2C payment
    const mpesaResponse = simulateB2CPayment(milestoneAmount, contractorName, contractorPhoneNumber);
    const transactionId = mpesaResponse.TransactionID;

    // Create payment transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        milestone_id,
        amount: milestoneAmount,
        transaction_type: 'release',
        payment_method: 'mpesa_demo',
        status: 'completed',
        stripe_transaction_id: transactionId
      })
      .select()
      .single()

    if (transactionError) {
      console.error('[B2C] Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Update milestone with optimistic lock on status
    await supabaseAdmin
      .from('project_milestones')
      .update({
        status: 'paid',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .eq('id', milestone_id)
      .eq('status', milestone.status) // Optimistic lock

    // SECURITY FIX: Optimistic lock on escrow balance
    const { error: escrowUpdateError } = await supabaseAdmin
      .from('escrow_accounts')
      .update({
        held_amount: escrow.held_amount - milestoneAmount,
        released_amount: escrow.released_amount + milestoneAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)
      .eq('held_amount', escrow.held_amount)

    if (escrowUpdateError) {
      console.error('[B2C] Escrow update conflict:', escrowUpdateError)
    }

    // Blockchain record
    await supabaseAdmin
      .from('blockchain_transactions')
      .insert({
        project_id: milestone.project_id,
        payment_transaction_id: transaction.id,
        amount: milestoneAmount,
        transaction_hash: `0x${transactionId}${Date.now().toString(16)}`,
        block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        block_number: Math.floor(Date.now() / 1000),
        network_status: 'confirmed',
        verification_data: {
          type: 'b2c_contractor_payment',
          milestone_title: milestone.title,
          contractor_name: contractorName,
          citizen_verifications: citizenVerificationCount,
          approved_by: profile.full_name || 'Government Official',
          timestamp: new Date().toISOString(),
          demo_mode: true
        },
        signatures: [
          { role: 'Government Approver', status: 'signed', timestamp: new Date().toISOString() },
          { role: 'Citizen Oversight', status: 'verified', count: citizenVerificationCount }
        ]
      })

    // Notifications
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Milestone Payment Released',
        message: `KES ${milestoneAmount.toLocaleString()} paid to ${contractorName} for "${milestone.title}". Ref: ${transactionId}`,
        type: 'success',
        category: 'payment'
      })

    if (project?.contractor_id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: project.contractor_id,
          title: 'Payment Received',
          message: `You received KES ${milestoneAmount.toLocaleString()} for completing "${milestone.title}". Ref: ${transactionId}`,
          type: 'success',
          category: 'payment'
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction: { id: transaction.id, mpesa_reference: transactionId, amount: milestoneAmount, status: 'completed' },
        milestone: { id: milestone_id, title: milestone.title, status: 'paid' },
        escrow: { remaining_balance: escrow.held_amount - milestoneAmount, total_released: escrow.released_amount + milestoneAmount },
        verification: { citizen_verifications: citizenVerificationCount },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[B2C] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})