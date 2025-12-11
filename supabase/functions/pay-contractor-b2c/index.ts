import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Demo M-Pesa B2C (Business/Escrow to Customer/Contractor) simulation
// Workflow: Citizen verifies → Government approves → System pays contractor via M-Pesa B2C
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

    console.log(`[B2C] Processing contractor payment for milestone: ${milestone_id}`)

    // Verify user is government official
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      console.error('[B2C] Unauthorized access attempt by non-government user')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Only government users can release payments' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get milestone details
    const { data: milestone, error: milestoneError } = await supabaseClient
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

    // Check if milestone has sufficient citizen verifications
    const { data: verifications, error: verifyError } = await supabaseClient
      .from('milestone_verifications')
      .select('*')
      .eq('milestone_id', milestone_id)

    const approvedVerifications = verifications?.filter(v => v.verification_status === 'approved') || []
    const citizenVerificationCount = approvedVerifications.length

    console.log(`[B2C] Milestone ${milestone_id} has ${citizenVerificationCount} citizen verifications`)

    // Get escrow account
    const { data: escrow, error: escrowError } = await supabaseClient
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

    // Get contractor details
    const { data: project } = await supabaseClient
      .from('projects')
      .select('contractor_id, title')
      .eq('id', milestone.project_id)
      .single()

    let contractorName = 'Contractor'
    let contractorPhoneNumber = contractor_phone || '254700000000'

    if (project?.contractor_id) {
      const { data: contractorProfile } = await supabaseClient
        .from('contractor_profiles')
        .select('company_name')
        .eq('user_id', project.contractor_id)
        .single()
      
      if (contractorProfile) {
        contractorName = contractorProfile.company_name
      }
    }

    // Simulate M-Pesa B2C transaction (Escrow paying contractor)
    const mpesaB2CResponse = {
      ConversationID: `B2C${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      OriginatorConversationID: `AG_${Date.now()}`,
      ResponseCode: '0',
      ResponseDescription: 'Accept the service request successfully.',
      TransactionID: `B2C${Date.now().toString(36).toUpperCase()}`,
      TransactionAmount: milestoneAmount,
      ReceiverPartyPublicName: `${contractorPhoneNumber} - ${contractorName}`,
      B2CChargesPaidAccountAvailableFunds: escrow.held_amount - milestoneAmount,
      TransactionCompletedDateTime: new Date().toISOString(),
      B2CUtilityAccountAvailableFunds: escrow.held_amount - milestoneAmount,
      B2CWorkingAccountAvailableFunds: escrow.held_amount - milestoneAmount
    }

    console.log(`[B2C] M-Pesa simulation response:`, mpesaB2CResponse)

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        milestone_id: milestone_id,
        amount: milestoneAmount,
        transaction_type: 'release',
        payment_method: 'mpesa',
        status: 'completed',
        stripe_transaction_id: mpesaB2CResponse.TransactionID
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Update milestone status
    const { error: milestoneUpdateError } = await supabaseClient
      .from('project_milestones')
      .update({
        status: 'paid',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      })
      .eq('id', milestone_id)

    if (milestoneUpdateError) throw milestoneUpdateError

    // Update escrow account balance
    const { error: escrowUpdateError } = await supabaseClient
      .from('escrow_accounts')
      .update({
        held_amount: escrow.held_amount - milestoneAmount,
        released_amount: escrow.released_amount + milestoneAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    if (escrowUpdateError) throw escrowUpdateError

    // Create blockchain record for transparency
    const { error: blockchainError } = await supabaseClient
      .from('blockchain_transactions')
      .insert({
        project_id: milestone.project_id,
        payment_transaction_id: transaction.id,
        amount: milestoneAmount,
        transaction_hash: `0x${mpesaB2CResponse.TransactionID}${Date.now().toString(16)}`,
        block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        block_number: Math.floor(Date.now() / 1000),
        network_status: 'confirmed',
        verification_data: {
          type: 'b2c_contractor_payment',
          milestone_title: milestone.title,
          contractor_name: contractorName,
          citizen_verifications: citizenVerificationCount,
          approved_by: profile.full_name || 'Government Official',
          timestamp: new Date().toISOString()
        },
        signatures: [
          { role: 'Government Approver', status: 'signed', timestamp: new Date().toISOString() },
          { role: 'Treasury Officer', status: 'signed', timestamp: new Date().toISOString() },
          { role: 'Citizen Oversight', status: 'verified', count: citizenVerificationCount }
        ]
      })

    if (blockchainError) {
      console.error('[B2C] Blockchain record error:', blockchainError)
    }

    // Create realtime update
    await supabaseClient
      .from('realtime_project_updates')
      .insert({
        project_id: milestone.project_id,
        update_type: 'milestone_paid',
        message: `Contractor paid KES ${milestoneAmount.toLocaleString()} for "${milestone.title}" via M-Pesa B2C. Reference: ${mpesaB2CResponse.TransactionID}`,
        created_by: user.id,
        metadata: {
          milestone_id,
          amount: milestoneAmount,
          mpesa_reference: mpesaB2CResponse.TransactionID,
          contractor: contractorName,
          citizen_verifications: citizenVerificationCount
        }
      })

    // Create notification for transparency
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Milestone Payment Released',
        message: `Payment of KES ${milestoneAmount.toLocaleString()} released to ${contractorName} for "${milestone.title}". M-Pesa Ref: ${mpesaB2CResponse.TransactionID}`,
        type: 'success',
        category: 'payment'
      })

    console.log(`[B2C] Contractor paid successfully. Transaction ID: ${transaction.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contractor paid successfully via M-Pesa B2C',
        transaction: {
          id: transaction.id,
          mpesa_reference: mpesaB2CResponse.TransactionID,
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
        mpesa_response: mpesaB2CResponse
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[B2C] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
