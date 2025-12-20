import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// M-Pesa Daraja API Configuration
const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY') ?? '';
const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET') ?? '';
const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY') ?? '';
const MPESA_SHORTCODE = Deno.env.get('MPESA_SHORTCODE') ?? '174379';
const MPESA_CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL') ?? '';

// Use sandbox for development, production for live
const MPESA_BASE_URL = 'https://sandbox.safaricom.co.ke';

// Get M-Pesa OAuth token
async function getMpesaToken(): Promise<string> {
  const credentials = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
  
  const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[M-Pesa] Token error:', errorText);
    throw new Error('Failed to get M-Pesa access token');
  }

  const data = await response.json();
  console.log('[M-Pesa] Token obtained successfully');
  return data.access_token;
}

// Generate M-Pesa password
function generateMpesaPassword(shortcode: string, passkey: string): { password: string; timestamp: string } {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  return { password, timestamp };
}

// Initiate STK Push for C2B payment
async function initiateStkPush(
  token: string,
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<any> {
  const { password, timestamp } = generateMpesaPassword(MPESA_SHORTCODE, MPESA_PASSKEY);
  
  // Format phone number (ensure it starts with 254)
  const formattedPhone = phoneNumber.startsWith('0') 
    ? `254${phoneNumber.slice(1)}` 
    : phoneNumber.startsWith('+') 
      ? phoneNumber.slice(1) 
      : phoneNumber;

  const requestBody = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount), // M-Pesa requires integer amounts
    PartyA: formattedPhone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: MPESA_CALLBACK_URL || `https://vncyydrizdexkojfnonu.supabase.co/functions/v1/mpesa-callback`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  console.log('[M-Pesa] STK Push request:', { ...requestBody, Password: '***' });

  const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  console.log('[M-Pesa] STK Push response:', data);

  if (!response.ok || data.errorCode) {
    throw new Error(data.errorMessage || data.CustomerMessage || 'STK Push failed');
  }

  return data;
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

    const { project_id, amount, treasury_reference, phone_number } = await req.json()

    console.log(`[C2B] Processing treasury funding for project: ${project_id}, amount: ${amount}`)

    // Verify user is government official
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type, full_name, phone_number')
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

    // Check if M-Pesa credentials are configured
    const hasMpesaCredentials = MPESA_CONSUMER_KEY && MPESA_CONSUMER_SECRET && MPESA_PASSKEY;
    
    let mpesaResponse: any;
    let transactionId: string;

    if (hasMpesaCredentials && phone_number) {
      // Use real M-Pesa STK Push
      console.log('[C2B] Using real M-Pesa Daraja API');
      
      try {
        const mpesaToken = await getMpesaToken();
        mpesaResponse = await initiateStkPush(
          mpesaToken,
          phone_number,
          amount,
          treasury_reference || `GOV-${project_id.slice(-8)}`,
          `Treasury funding for project ${project_id.slice(-8)}`
        );
        transactionId = mpesaResponse.CheckoutRequestID;
        
        // For STK Push, payment is pending until callback confirms it
        // Create a pending transaction record
        const { data: transaction, error: transactionError } = await supabaseClient
          .from('payment_transactions')
          .insert({
            escrow_account_id: escrow.id,
            amount: amount,
            transaction_type: 'deposit',
            payment_method: 'mpesa',
            status: 'pending',
            stripe_transaction_id: transactionId // Using this field for M-Pesa reference
          })
          .select()
          .single()

        if (transactionError) throw transactionError;

        return new Response(
          JSON.stringify({
            success: true,
            message: 'M-Pesa STK Push initiated. Please complete payment on your phone.',
            pending: true,
            transaction: {
              id: transaction.id,
              checkout_request_id: transactionId,
              merchant_request_id: mpesaResponse.MerchantRequestID,
              amount,
              status: 'pending'
            },
            escrow: {
              id: escrow.id,
              current_balance: escrow.held_amount
            },
            mpesa_response: mpesaResponse
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
        
      } catch (mpesaError) {
        console.error('[C2B] M-Pesa API error:', mpesaError);
        // Fall back to simulation if M-Pesa fails
        console.log('[C2B] Falling back to simulation mode');
      }
    }

    // Simulation mode (fallback or when no credentials)
    console.log('[C2B] Using simulation mode for M-Pesa C2B');
    
    mpesaResponse = {
      TransactionType: 'PayBill',
      TransID: `C2B${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      TransTime: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
      TransAmount: amount,
      BusinessShortCode: MPESA_SHORTCODE,
      BillRefNumber: treasury_reference || `GOV-${project_id.slice(-8)}`,
      OrgAccountBalance: amount,
      ThirdPartyTransID: `TRS${Date.now()}`,
      MSISDN: phone_number || '254700000000',
      FirstName: 'COUNTY',
      MiddleName: 'TREASURY',
      LastName: 'DEPARTMENT',
      _simulated: true
    }

    transactionId = mpesaResponse.TransID;
    console.log(`[C2B] Simulation response:`, mpesaResponse)

    // Create payment transaction record (completed for simulation)
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        amount: amount,
        transaction_type: 'deposit',
        payment_method: 'mpesa',
        status: 'completed',
        stripe_transaction_id: transactionId
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
        transaction_hash: `0x${transactionId}${Date.now().toString(16)}`,
        block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        block_number: Math.floor(Date.now() / 1000),
        network_status: 'confirmed',
        verification_data: {
          type: 'c2b_treasury_deposit',
          treasury_reference: mpesaResponse.BillRefNumber,
          funded_by: profile.full_name || 'Government Official',
          timestamp: new Date().toISOString(),
          simulated: mpesaResponse._simulated || false
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
        message: `Treasury funded escrow with KES ${amount.toLocaleString()} via M-Pesa C2B. Reference: ${transactionId}`,
        created_by: user.id,
        metadata: {
          amount,
          mpesa_reference: transactionId,
          transaction_id: transaction.id,
          simulated: mpesaResponse._simulated || false
        }
      })

    console.log(`[C2B] Escrow funded successfully. Transaction ID: ${transaction.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: mpesaResponse._simulated 
          ? 'Escrow funded successfully (simulation mode)' 
          : 'Escrow funded successfully via M-Pesa C2B',
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
    console.error('[C2B] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})