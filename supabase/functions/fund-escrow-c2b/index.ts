import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Demo M-Pesa C2B (Customer/Treasury to Business/Escrow) simulation
// Workflow: Government approves project → Treasury funds escrow via M-Pesa C2B
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

    const { project_id, amount, treasury_reference } = await req.json()

    console.log(`[C2B] Processing treasury funding for project: ${project_id}, amount: ${amount}`)

    // Verify user is government official
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      console.error('[C2B] Unauthorized access attempt by non-government user')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Only government users can fund escrow' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    if (!project_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: project_id and positive amount required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create escrow account
    let { data: escrow, error: escrowError } = await supabaseClient
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', project_id)
      .single()

    if (escrowError && escrowError.code !== 'PGRST116') {
      throw escrowError
    }

    // Create escrow if doesn't exist
    if (!escrow) {
      const { data: newEscrow, error: createError } = await supabaseClient
        .from('escrow_accounts')
        .insert({
          project_id,
          total_amount: amount,
          held_amount: 0,
          released_amount: 0,
          status: 'active'
        })
        .select()
        .single()

      if (createError) throw createError
      escrow = newEscrow
    }

    // Simulate M-Pesa C2B transaction (Treasury funding escrow)
    const mpesaC2BResponse = {
      TransactionType: 'PayBill',
      TransID: `C2B${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      TransTime: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
      TransAmount: amount,
      BusinessShortCode: '174379', // Demo paybill
      BillRefNumber: treasury_reference || `GOV-${project_id.slice(-8)}`,
      OrgAccountBalance: amount,
      ThirdPartyTransID: `TRS${Date.now()}`,
      MSISDN: '254700000000', // Treasury phone placeholder
      FirstName: 'COUNTY',
      MiddleName: 'TREASURY',
      LastName: 'DEPARTMENT'
    }

    console.log(`[C2B] M-Pesa simulation response:`, mpesaC2BResponse)

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        amount: amount,
        transaction_type: 'deposit',
        payment_method: 'mpesa',
        status: 'completed',
        stripe_transaction_id: mpesaC2BResponse.TransID // Using this field for M-Pesa ref
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Update escrow account balance
    const { error: updateError } = await supabaseClient
      .from('escrow_accounts')
      .update({
        held_amount: escrow.held_amount + amount,
        total_amount: escrow.total_amount + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    if (updateError) throw updateError

    // Create blockchain record for transparency
    const { error: blockchainError } = await supabaseClient
      .from('blockchain_transactions')
      .insert({
        project_id,
        payment_transaction_id: transaction.id,
        amount: amount,
        transaction_hash: `0x${mpesaC2BResponse.TransID}${Date.now().toString(16)}`,
        block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        block_number: Math.floor(Date.now() / 1000),
        network_status: 'confirmed',
        verification_data: {
          type: 'c2b_treasury_deposit',
          treasury_reference: mpesaC2BResponse.BillRefNumber,
          funded_by: profile.full_name || 'Government Official',
          timestamp: new Date().toISOString()
        },
        signatures: [
          { role: 'Treasury Officer', status: 'signed', timestamp: new Date().toISOString() },
          { role: 'County Accountant', status: 'signed', timestamp: new Date().toISOString() }
        ]
      })

    if (blockchainError) {
      console.error('[C2B] Blockchain record error:', blockchainError)
    }

    // Create realtime update
    await supabaseClient
      .from('realtime_project_updates')
      .insert({
        project_id,
        update_type: 'escrow_funded',
        message: `Treasury funded escrow with KES ${amount.toLocaleString()} via M-Pesa C2B. Reference: ${mpesaC2BResponse.TransID}`,
        created_by: user.id,
        metadata: {
          amount,
          mpesa_reference: mpesaC2BResponse.TransID,
          transaction_id: transaction.id
        }
      })

    console.log(`[C2B] Escrow funded successfully. Transaction ID: ${transaction.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Escrow funded successfully via M-Pesa C2B',
        transaction: {
          id: transaction.id,
          mpesa_reference: mpesaC2BResponse.TransID,
          amount,
          status: 'completed'
        },
        escrow: {
          id: escrow.id,
          held_amount: escrow.held_amount + amount,
          total_amount: escrow.total_amount + amount
        },
        mpesa_response: mpesaC2BResponse
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[C2B] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
