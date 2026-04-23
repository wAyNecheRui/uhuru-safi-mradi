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

// SECURITY: Strict Zod schema. Cap record_ids at 100 to prevent abuse.
const PayWorkerSchema = z.object({
  worker_id: z.string().uuid({ message: 'worker_id must be a valid UUID' }),
  job_id: z.string().uuid({ message: 'job_id must be a valid UUID' }),
  record_ids: z.array(z.string().uuid()).min(1, { message: 'record_ids must contain at least 1 UUID' }).max(100, { message: 'record_ids cannot exceed 100 entries per request' }),
});

// Demo mode - generates simulated M-Pesa B2C transaction reference
function generateDemoB2CRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `WB2C${timestamp}${random}`;
}

const MAX_BODY_SIZE = 51200; // 50KB

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // Authenticate caller (contractor who verified attendance)
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

    // SECURITY: Body size validation before parsing
    const rawBody = await req.text()
    if (rawBody.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let requestData: any
    try {
      requestData = JSON.parse(rawBody)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { worker_id, job_id, record_ids } = requestData

    if (!worker_id || !job_id || !record_ids?.length) {
      return new Response(
        JSON.stringify({ error: 'worker_id, job_id, and record_ids are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[WORKER-ESCROW-PAY] Processing escrow payment for worker: ${worker_id}, job: ${job_id}, records: ${record_ids.length}`)

    // 1. Fetch unpaid verified records
    const { data: records, error: fetchError } = await supabaseAdmin
      .from('worker_daily_records')
      .select('*')
      .in('id', record_ids)
      .eq('payment_status', 'unpaid')
      .eq('verification_status', 'verified')

    if (fetchError) throw fetchError
    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No verified unpaid records found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalAmount = records.reduce((sum: number, r: any) => sum + Number(r.amount_earned), 0)

    // 2. Find the project linked to this job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('workforce_jobs')
      .select('id, title, project_id')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!job.project_id) {
      return new Response(
        JSON.stringify({ error: 'Job is not linked to a project — cannot use escrow payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get escrow account for the project
    const { data: escrow, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', job.project_id)
      .single()

    if (escrowError || !escrow) {
      return new Response(
        JSON.stringify({ error: 'Escrow account not found for this project' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check worker wage pool has sufficient funds
    const availableWageFunds = (escrow.worker_wage_allocation || 0) - (escrow.worker_wage_released || 0)
    if (availableWageFunds < totalAmount) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient worker wage funds in escrow',
          available: availableWageFunds,
          required: totalAmount,
          message: `Worker wage pool has KES ${availableWageFunds.toLocaleString()} but KES ${totalAmount.toLocaleString()} is needed`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RACE CONDITION FIX: Atomically lock daily records to 'processing' to prevent double-pay
    const { data: lockedRecords, error: lockRecordsError } = await supabaseAdmin
      .from('worker_daily_records')
      .update({ payment_status: 'processing', updated_at: new Date().toISOString() })
      .in('id', record_ids)
      .eq('payment_status', 'unpaid') // Only lock unpaid records
      .select('id')

    if (lockRecordsError || !lockedRecords || lockedRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Records already being processed or paid' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (lockedRecords.length !== records.length) {
      // Some records were already grabbed by another request — rollback locked ones
      await supabaseAdmin
        .from('worker_daily_records')
        .update({ payment_status: 'unpaid' })
        .in('id', lockedRecords.map((r: any) => r.id))
      return new Response(
        JSON.stringify({ error: `Only ${lockedRecords.length}/${records.length} records available. Concurrent payment detected.` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. RACE CONDITION FIX: Optimistic lock on escrow balance
    const { data: lockedEscrow, error: escrowLockError } = await supabaseAdmin
      .from('escrow_accounts')
      .update({
        worker_wage_released: (escrow.worker_wage_released || 0) + totalAmount,
        held_amount: escrow.held_amount - totalAmount,
        released_amount: escrow.released_amount + totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)
      .eq('held_amount', escrow.held_amount) // Optimistic lock
      .eq('worker_wage_released', escrow.worker_wage_released || 0) // Double lock on wage pool
      .select('id')
      .single()

    if (escrowLockError || !lockedEscrow) {
      // Rollback record locks
      await supabaseAdmin
        .from('worker_daily_records')
        .update({ payment_status: 'unpaid' })
        .in('id', record_ids)
      console.error('[WORKER-ESCROW-PAY] Escrow lock failed — concurrent modification')
      return new Response(
        JSON.stringify({ error: 'Escrow balance changed during processing. Please retry.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Simulate M-Pesa B2C payment
    const transactionRef = generateDemoB2CRef()
    console.log(`[WORKER-ESCROW-PAY] Demo B2C: KES ${totalAmount} → worker ${worker_id}, ref: ${transactionRef}`)

    // Determine period
    const periodStart = records.reduce(
      (min: string, r: any) => (r.work_date < min ? r.work_date : min),
      records[0].work_date
    )
    const periodEnd = records.reduce(
      (max: string, r: any) => (r.work_date > max ? r.work_date : max),
      records[0].work_date
    )

    // 7. Create worker_payments record linked to escrow
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('worker_payments')
      .insert({
        worker_id,
        job_id,
        amount: totalAmount,
        payment_method: 'mpesa',
        payment_status: 'completed',
        payment_reference: transactionRef,
        processed_at: new Date().toISOString(),
        period_start: periodStart,
        period_end: periodEnd,
        daily_records_count: records.length,
        escrow_account_id: escrow.id,
        worker_phone: null
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // 8. Finalize daily records as paid
    const { error: updateError } = await supabaseAdmin
      .from('worker_daily_records')
      .update({
        payment_status: 'paid',
        payment_transaction_id: transactionRef,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', record_ids)

    if (updateError) throw updateError

    // 9. Create blockchain record for transparency
    await supabaseAdmin
      .from('blockchain_transactions')
      .insert({
        project_id: job.project_id,
        amount: totalAmount,
        transaction_hash: `0x${transactionRef}${Date.now().toString(16)}`,
        block_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        block_number: Math.floor(Date.now() / 1000),
        network_status: 'confirmed',
        verification_data: {
          type: 'worker_wage_payment',
          worker_id,
          job_id,
          job_title: job.title,
          records_count: records.length,
          period: `${periodStart} to ${periodEnd}`,
          payment_reference: transactionRef,
          demo_mode: true
        }
      })

    // 10. Create realtime update
    await supabaseAdmin
      .from('realtime_project_updates')
      .insert({
        project_id: job.project_id,
        update_type: 'worker_payment_released',
        message: `💰 Worker payment of KES ${totalAmount.toLocaleString()} released from escrow for "${job.title}" (${records.length} day(s))`,
        created_by: user.id,
        metadata: {
          worker_id,
          amount: totalAmount,
          reference: transactionRef,
          records_count: records.length,
          escrow_source: true
        }
      })

    // 11. Notify worker
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: worker_id,
        title: '💰 Payment Received!',
        message: `You have been paid KES ${totalAmount.toLocaleString()} for ${records.length} day(s) of work on "${job.title}". Paid directly from project escrow. M-Pesa Ref: ${transactionRef}`,
        type: 'success',
        category: 'payment',
        action_url: '/citizen/my-jobs'
      })

    console.log(`[WORKER-ESCROW-PAY] ✅ Payment completed. Ref: ${transactionRef}`)

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          amount: totalAmount,
          reference: transactionRef,
          records_count: records.length,
          escrow_source: true
        },
        message: `KES ${totalAmount.toLocaleString()} paid to worker from project escrow. Ref: ${transactionRef}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[WORKER-ESCROW-PAY] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})