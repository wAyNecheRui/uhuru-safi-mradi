import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// M-Pesa STK Push callback handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for callbacks
    )

    const callbackData = await req.json()
    console.log('[M-Pesa Callback] Received:', JSON.stringify(callbackData, null, 2))

    // Handle STK Push callback
    if (callbackData.Body?.stkCallback) {
      const stkCallback = callbackData.Body.stkCallback
      const checkoutRequestId = stkCallback.CheckoutRequestID
      const resultCode = stkCallback.ResultCode
      const resultDesc = stkCallback.ResultDesc

      console.log(`[M-Pesa Callback] CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`)

      // Find the pending transaction
      const { data: transaction, error: findError } = await supabaseClient
        .from('payment_transactions')
        .select('*, escrow_accounts(project_id)')
        .eq('stripe_transaction_id', checkoutRequestId)
        .eq('status', 'pending')
        .single()

      if (findError || !transaction) {
        console.error('[M-Pesa Callback] Transaction not found:', checkoutRequestId)
        return new Response(
          JSON.stringify({ success: false, message: 'Transaction not found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (resultCode === 0) {
        // Payment successful
        const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
        const mpesaReceiptNumber = callbackMetadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
        const amount = callbackMetadata.find((i: any) => i.Name === 'Amount')?.Value
        const phoneNumber = callbackMetadata.find((i: any) => i.Name === 'PhoneNumber')?.Value

        console.log(`[M-Pesa Callback] Payment successful. Receipt: ${mpesaReceiptNumber}, Amount: ${amount}`)

        // Update transaction to completed
        await supabaseClient
          .from('payment_transactions')
          .update({
            status: 'completed',
            stripe_transaction_id: mpesaReceiptNumber || checkoutRequestId
          })
          .eq('id', transaction.id)

        // Update escrow balance
        const { data: escrow } = await supabaseClient
          .from('escrow_accounts')
          .select('*')
          .eq('id', transaction.escrow_account_id)
          .single()

        if (escrow) {
          await supabaseClient
            .from('escrow_accounts')
            .update({
              held_amount: escrow.held_amount + transaction.amount,
              total_amount: escrow.total_amount + transaction.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', escrow.id)

          // Create blockchain record
          await supabaseClient
            .from('blockchain_transactions')
            .insert({
              project_id: escrow.project_id,
              payment_transaction_id: transaction.id,
              amount: transaction.amount,
              transaction_hash: `0x${mpesaReceiptNumber || checkoutRequestId}${Date.now().toString(16)}`,
              block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
              block_number: Math.floor(Date.now() / 1000),
              network_status: 'confirmed',
              verification_data: {
                type: 'c2b_treasury_deposit',
                mpesa_receipt: mpesaReceiptNumber,
                phone_number: phoneNumber,
                confirmed_at: new Date().toISOString()
              }
            })

          // Create realtime update
          await supabaseClient
            .from('realtime_project_updates')
            .insert({
              project_id: escrow.project_id,
              update_type: 'escrow_funded',
              message: `Escrow funded with KES ${transaction.amount.toLocaleString()} via M-Pesa. Receipt: ${mpesaReceiptNumber}`,
              created_by: '00000000-0000-0000-0000-000000000000', // System user
              metadata: {
                amount: transaction.amount,
                mpesa_receipt: mpesaReceiptNumber,
                callback_confirmed: true
              }
            })
        }

        console.log(`[M-Pesa Callback] Transaction ${transaction.id} completed successfully`)

      } else {
        // Payment failed
        console.log(`[M-Pesa Callback] Payment failed: ${resultDesc}`)

        await supabaseClient
          .from('payment_transactions')
          .update({
            status: 'failed'
          })
          .eq('id', transaction.id)
      }

      return new Response(
        JSON.stringify({ success: true, resultCode, resultDesc }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle C2B validation/confirmation (if registered)
    if (callbackData.TransactionType === 'Pay Bill') {
      console.log('[M-Pesa Callback] C2B Pay Bill callback received')
      // Handle C2B callback logic here if needed
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[M-Pesa Callback] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // Always return 200 for M-Pesa
    )
  }
})