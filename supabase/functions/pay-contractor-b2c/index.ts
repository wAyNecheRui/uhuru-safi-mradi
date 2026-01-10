import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Demo mode configuration - simulates M-Pesa B2C payments for testing
const DEMO_MODE = true;
const DEMO_SHORTCODE = '174379';

// Generate simulated M-Pesa B2C transaction reference
function generateDemoB2CTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `B2C${timestamp}${random}`;
}

// Simulate M-Pesa B2C payment response
function simulateB2CPayment(amount: number, contractorName: string, contractorPhone: string) {
  const transactionId = generateDemoB2CTransactionId();
  const conversationId = `AG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  return {
    ConversationID: conversationId,
    OriginatorConversationID: `OC_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Accept the service request successfully.',
    TransactionID: transactionId,
    TransactionAmount: amount,
    ReceiverPartyPublicName: `${contractorPhone} - ${contractorName}`,
    B2CChargesPaidAccountAvailableFunds: 0,
    TransactionCompletedDateTime: new Date().toISOString(),
    ResultCode: '0',
    ResultDesc: 'The service request is processed successfully.',
    _demo: true,
    _timestamp: new Date().toISOString()
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role for admin operations to bypass RLS
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { milestone_id, contractor_phone } = await req.json()

    console.log(`[B2C-DEMO] Processing contractor payment for milestone: ${milestone_id}, user: ${user.id}`)

    // Verify user is government official - use admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type, full_name')
      .eq('user_id', user.id)
      .single()

    console.log(`[B2C-DEMO] User profile lookup result:`, { profile, profileError })

    if (profileError) {
      console.error('[B2C-DEMO] Profile lookup error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile || profile.user_type !== 'government') {
      console.error(`[B2C-DEMO] Unauthorized access attempt by user ${user.id} with type: ${profile?.user_type}`)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Only government users can release payments' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get milestone details - use admin client
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

    // Check if milestone has citizen verifications
    const { data: verifications } = await supabaseAdmin
      .from('milestone_verifications')
      .select('*')
      .eq('milestone_id', milestone_id)

    const approvedVerifications = verifications?.filter(v => v.verification_status === 'approved') || []
    const citizenVerificationCount = approvedVerifications.length

    console.log(`[B2C-DEMO] Milestone ${milestone_id} has ${citizenVerificationCount} citizen verifications`)

    // Get escrow account - use admin client
    const { data: escrow, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', milestone.project_id)
      .single()

    if (escrowError || !escrow) {
      return new Response(
        JSON.stringify({ error: 'Escrow account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate milestone payment amount
    const milestoneAmount = (escrow.total_amount * milestone.payment_percentage) / 100

    // Check if enough funds in escrow
    if (escrow.held_amount < milestoneAmount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient funds in escrow account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get contractor details - use admin client
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('contractor_id, title')
      .eq('id', milestone.project_id)
      .single()

    let contractorName = 'Demo Contractor'
    let contractorPhoneNumber = contractor_phone || '254700000000'

    if (project?.contractor_id) {
      const { data: contractorProfile } = await supabaseAdmin
        .from('contractor_profiles')
        .select('company_name')
        .eq('user_id', project.contractor_id)
        .single()
      
      if (contractorProfile) {
        contractorName = contractorProfile.company_name
      }

      // Try to get contractor's phone from user_profiles
      const { data: contractorUser } = await supabaseAdmin
        .from('user_profiles')
        .select('phone_number')
        .eq('user_id', project.contractor_id)
        .single()
      
      if (contractorUser?.phone_number && !contractor_phone) {
        contractorPhoneNumber = contractorUser.phone_number
      }
    }

    // Demo mode - simulate M-Pesa B2C payment
    console.log('[B2C-DEMO] Running in DEMO mode - simulating M-Pesa B2C payment');
    
    const mpesaResponse = simulateB2CPayment(milestoneAmount, contractorName, contractorPhoneNumber);
    const transactionId = mpesaResponse.TransactionID;

    console.log(`[B2C-DEMO] Simulated B2C payment:`, mpesaResponse);

    // Create payment transaction record - use admin client
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        milestone_id: milestone_id,
        amount: milestoneAmount,
        transaction_type: 'release',
        payment_method: 'mpesa_demo',
        status: 'completed',
        stripe_transaction_id: transactionId
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Update milestone status
    const { error: milestoneUpdateError } = await supabaseAdmin
      .from('project_milestones')
      .update({
        status: 'paid',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .eq('id', milestone_id)

    if (milestoneUpdateError) throw milestoneUpdateError

    // Update escrow account balance
    const { error: escrowUpdateError } = await supabaseAdmin
      .from('escrow_accounts')
      .update({
        held_amount: escrow.held_amount - milestoneAmount,
        released_amount: escrow.released_amount + milestoneAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    if (escrowUpdateError) throw escrowUpdateError

    // Create blockchain record for transparency
    const { error: blockchainError } = await supabaseAdmin
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
          { role: 'Treasury Officer', status: 'signed', timestamp: new Date().toISOString() },
          { role: 'Citizen Oversight', status: 'verified', count: citizenVerificationCount }
        ]
      })

    if (blockchainError) {
      console.error('[B2C-DEMO] Blockchain record error:', blockchainError)
    }

    // Create realtime update
    await supabaseAdmin
      .from('realtime_project_updates')
      .insert({
        project_id: milestone.project_id,
        update_type: 'milestone_paid',
        message: `Demo: Contractor paid KES ${milestoneAmount.toLocaleString()} for "${milestone.title}". Ref: ${transactionId}`,
        created_by: user.id,
        metadata: {
          milestone_id,
          amount: milestoneAmount,
          mpesa_reference: transactionId,
          contractor: contractorName,
          citizen_verifications: citizenVerificationCount,
          demo_mode: true
        }
      })

    // Create notifications
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Milestone Payment Released',
        message: `Demo: KES ${milestoneAmount.toLocaleString()} paid to ${contractorName} for "${milestone.title}". Ref: ${transactionId}`,
        type: 'success',
        category: 'payment'
      })

    // Notify contractor if we have their ID
    if (project?.contractor_id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: project.contractor_id,
          title: 'Payment Received',
          message: `Demo: You received KES ${milestoneAmount.toLocaleString()} for completing "${milestone.title}". Ref: ${transactionId}`,
          type: 'success',
          category: 'payment'
        })
    }

    console.log(`[B2C-DEMO] Contractor paid successfully. Transaction ID: ${transaction.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contractor paid successfully (Demo Mode)',
        demo_mode: true,
        transaction: {
          id: transaction.id,
          mpesa_reference: transactionId,
          amount: milestoneAmount,
          status: 'completed'
        },
        milestone: {
          id: milestone_id,
          title: milestone.title,
          status: 'paid'
        },
        escrow: {
          id: escrow.id,
          remaining_balance: escrow.held_amount - milestoneAmount,
          total_released: escrow.released_amount + milestoneAmount
        },
        verification: {
          citizen_verifications: citizenVerificationCount,
          approved_by: profile.full_name
        },
        mpesa_response: mpesaResponse
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[B2C-DEMO] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
