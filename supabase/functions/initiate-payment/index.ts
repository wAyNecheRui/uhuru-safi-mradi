import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://esm.sh/zod@3.23.8"

// SECURITY: Strict input schema (Phase 7 hardening)
const InitiatePaymentSchema = z.object({
  escrow_account_id: z.string().uuid(),
  amount: z.number().positive().finite().max(100_000_000_000),
  payment_method: z.enum(['mpesa', 'bank_transfer', 'manual']),
  phone_number: z.string().trim().max(20).regex(/^[0-9+]*$/).optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
}

const MAX_BODY_SIZE = 51200;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // SECURITY: Use service role for all DB ops to avoid RLS issues on payment_transactions
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

    // SECURITY: Payload size limit
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

    const parsed = InitiatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { escrow_account_id, amount, phone_number, payment_method } = parsed.data;

    // SECURITY: Role check — government only
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: government role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Verify escrow account exists and is active
    const { data: escrow, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .select('id, status, total_amount, held_amount, project_id')
      .eq('id', escrow_account_id)
      .is('deleted_at', null)
      .single()

    if (escrowError || !escrow) {
      return new Response(
        JSON.stringify({ error: 'Escrow account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (escrow.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Escrow account is not active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Check for overfunding
    if (escrow.held_amount + amount > escrow.total_amount) {
      return new Response(
        JSON.stringify({ error: `Deposit would exceed escrow budget. Max deposit: ${escrow.total_amount - escrow.held_amount}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create payment transaction — use admin client
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        escrow_account_id,
        amount,
        transaction_type: 'deposit',
        payment_method,
        status: 'pending'
      })
      .select()
      .single()

    if (transactionError) {
      console.error('[initiate-payment] Transaction creation error:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simulate M-Pesa STK Push
    let paymentResponse = null
    if (payment_method === 'mpesa') {
      paymentResponse = {
        CheckoutRequestID: `ws_CO_${Date.now()}`,
        ResponseCode: "0",
        ResponseDescription: "Request accepted for processing",
        CustomerMessage: "Request accepted for processing"
      }

      await supabaseAdmin
        .from('payment_transactions')
        .update({ stripe_transaction_id: paymentResponse.CheckoutRequestID })
        .eq('id', transaction.id)
    }

    // Notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Payment Initiated',
        message: `Payment of KES ${amount.toLocaleString()} initiated via ${payment_method.toUpperCase()}.`,
        type: 'info',
        category: 'payment'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction: { id: transaction.id, status: transaction.status },
        paymentResponse,
        message: 'Payment initiated successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[initiate-payment] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})