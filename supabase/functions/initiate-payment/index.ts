
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { escrow_account_id, amount, phone_number, payment_method } = await req.json()

    // Verify user has permission to initiate payments (government users only)
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Only government users can initiate payments' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate input data
    if (!escrow_account_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
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
      throw transactionError
    }

    // For M-Pesa integration (placeholder - would integrate with actual M-Pesa API)
    let paymentResponse = null
    if (payment_method === 'mpesa') {
      // Simulate M-Pesa STK Push
      paymentResponse = {
        CheckoutRequestID: `ws_CO_${Date.now()}`,
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: "Success. Request accepted for processing"
      }

      // Update transaction with M-Pesa details
      await supabaseClient
        .from('payment_transactions')
        .update({
          mpesa_transaction_id: paymentResponse.CheckoutRequestID,
          status: 'pending'
        })
        .eq('id', transaction.id)
    }

    // Create notification
    await supabaseClient
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
        transaction,
        paymentResponse,
        message: 'Payment initiated successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
