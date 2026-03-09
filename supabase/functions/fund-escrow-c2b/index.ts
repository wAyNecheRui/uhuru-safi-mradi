import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Demo mode configuration - simulates M-Pesa transactions for testing
const DEMO_MODE = true;
const DEMO_SHORTCODE = '174379';

// Generate simulated M-Pesa transaction reference
function generateDemoTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `DEMO${timestamp}${random}`;
}

// Simulate M-Pesa C2B payment response
function simulateC2BPayment(amount: number, treasuryReference: string, projectId: string) {
  const transactionId = generateDemoTransactionId();
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  
  return {
    TransactionType: 'PayBill',
    TransID: transactionId,
    TransTime: timestamp,
    TransAmount: amount,
    BusinessShortCode: DEMO_SHORTCODE,
    BillRefNumber: treasuryReference || `GOV-${projectId.slice(-8)}`,
    OrgAccountBalance: amount,
    ThirdPartyTransID: `TRS${Date.now()}`,
    MSISDN: '254700000000',
    FirstName: 'COUNTY',
    MiddleName: 'TREASURY',
    LastName: 'DEMO',
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

    const { project_id, amount, treasury_reference, worker_wage_allocation } = await req.json()

    console.log(`[C2B-DEMO] Processing treasury funding for project: ${project_id}, amount: ${amount}, user: ${user.id}`)

    // Verify user is government official - use admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type, full_name, phone_number')
      .eq('user_id', user.id)
      .single()

    console.log(`[C2B-DEMO] User profile lookup result:`, { profile, profileError })

    if (profileError) {
      console.error('[C2B-DEMO] Profile lookup error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile || profile.user_type !== 'government') {
      console.error(`[C2B-DEMO] Unauthorized access attempt by user ${user.id} with type: ${profile?.user_type}`)
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

    // Get or create escrow account - use admin client
    let { data: escrow, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', project_id)
      .single()

    if (escrowError && escrowError.code !== 'PGRST116') {
      throw escrowError
    }

    // Create escrow if doesn't exist
    if (!escrow) {
      console.log(`[C2B-DEMO] Creating new escrow account for project: ${project_id}`)
      const { data: newEscrow, error: createError } = await supabaseAdmin
        .from('escrow_accounts')
        .insert({
          project_id,
          total_amount: 0,
          held_amount: 0,
          released_amount: 0,
          status: 'active'
        })
        .select()
        .single()

      if (createError) throw createError
      escrow = newEscrow
    }

    // Demo mode - simulate M-Pesa C2B payment
    console.log('[C2B-DEMO] Running in DEMO mode - simulating M-Pesa payment');
    
    const mpesaResponse = simulateC2BPayment(amount, treasury_reference, project_id);
    const transactionId = mpesaResponse.TransID;

    console.log(`[C2B-DEMO] Simulated transaction:`, mpesaResponse);

    // Create payment transaction record - use admin client
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        amount: amount,
        transaction_type: 'deposit',
        payment_method: 'mpesa_demo',
        status: 'completed',
        stripe_transaction_id: transactionId
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Update escrow account balance (including worker wage allocation)
    const wageAlloc = worker_wage_allocation || 0
    const { error: updateError } = await supabaseAdmin
      .from('escrow_accounts')
      .update({
        held_amount: escrow.held_amount + amount,
        total_amount: escrow.total_amount + amount,
        worker_wage_allocation: (escrow.worker_wage_allocation || 0) + wageAlloc,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    if (updateError) throw updateError

    // Create blockchain record for transparency
    const { error: blockchainError } = await supabaseAdmin
      .from('blockchain_transactions')
      .insert({
        project_id,
        payment_transaction_id: transaction.id,
        amount: amount,
        transaction_hash: `0x${transactionId}${Date.now().toString(16)}`,
        block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        block_number: Math.floor(Date.now() / 1000),
        network_status: 'confirmed',
        verification_data: {
          type: 'c2b_treasury_deposit',
          treasury_reference: mpesaResponse.BillRefNumber,
          funded_by: profile.full_name || 'Government Official',
          timestamp: new Date().toISOString(),
          demo_mode: true
        },
        signatures: [
          { role: 'Treasury Officer', status: 'signed', timestamp: new Date().toISOString() },
          { role: 'County Accountant', status: 'signed', timestamp: new Date().toISOString() }
        ]
      })

    if (blockchainError) {
      console.error('[C2B-DEMO] Blockchain record error:', blockchainError)
    }

    // Create realtime update
    await supabaseAdmin
      .from('realtime_project_updates')
      .insert({
        project_id,
        update_type: 'escrow_funded',
        message: `Treasury funded escrow with KES ${amount.toLocaleString()} (Demo Mode). Reference: ${transactionId}`,
        created_by: user.id,
        metadata: {
          amount,
          mpesa_reference: transactionId,
          transaction_id: transaction.id,
          demo_mode: true
        }
      })

    // Create notification for the user
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Escrow Funded Successfully',
        message: `Demo: KES ${amount.toLocaleString()} deposited to project escrow. Ref: ${transactionId}`,
        type: 'success',
        category: 'payment'
      })

    console.log(`[C2B-DEMO] Escrow funded successfully. Transaction ID: ${transaction.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Escrow funded successfully (Demo Mode)',
        demo_mode: true,
        transaction: {
          id: transaction.id,
          mpesa_reference: transactionId,
          amount,
          status: 'completed'
        },
        escrow: {
          id: escrow.id,
          held_amount: escrow.held_amount + amount,
          total_amount: escrow.total_amount + amount
        },
        mpesa_response: mpesaResponse
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[C2B-DEMO] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
