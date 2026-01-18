import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Constants for verification requirements (must match frontend)
const REQUIRED_CITIZEN_VERIFICATIONS = 2;
const MINIMUM_APPROVAL_RATING = 3;

// Generate demo payment reference
function generatePaymentRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `AUTO${timestamp}${random}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role for admin operations (bypasses RLS)
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
    let userId: string | null = null
    
    // Authentication is optional - can be called by authenticated user or internally
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
      
      if (!authError && user) {
        userId = user.id
      }
    }

    const { milestoneId } = await req.json()

    if (!milestoneId) {
      return new Response(
        JSON.stringify({ error: 'Milestone ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`[AUTO-RELEASE] Processing auto-release for milestone: ${milestoneId}, triggered by: ${userId || 'system'}`)

    // 1. Get all verifications for this milestone
    const { data: verifications, error: verError } = await supabaseAdmin
      .from('milestone_verifications')
      .select('*')
      .eq('milestone_id', milestoneId)

    if (verError) {
      console.error('[AUTO-RELEASE] Error fetching verifications:', verError)
      throw verError
    }

    // 2. Count approved verifications and calculate average rating
    const approvedVerifications = verifications?.filter(
      v => v.verification_status === 'approved'
    ) || []

    const approvedCount = approvedVerifications.length

    let totalRating = 0
    let ratingCount = 0
    approvedVerifications.forEach(v => {
      // Match both integer and decimal ratings like "Rating: 4/5" or "Rating: 3.8/5" or "Rating: 4.0000000000000000/5"
      const match = v.verification_notes?.match(/Rating:\s*([\d.]+)/)
      if (match) {
        const rating = parseFloat(match[1])
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          totalRating += rating
          ratingCount++
        }
      }
    })
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0

    console.log(`[AUTO-RELEASE] Verification status: ${approvedCount}/${REQUIRED_CITIZEN_VERIFICATIONS} approvals, avg rating: ${averageRating}`)

    // 3. Check if threshold met
    const canRelease = approvedCount >= REQUIRED_CITIZEN_VERIFICATIONS && averageRating >= MINIMUM_APPROVAL_RATING

    if (!canRelease) {
      let message = ''
      if (approvedCount < REQUIRED_CITIZEN_VERIFICATIONS) {
        message = `Need ${REQUIRED_CITIZEN_VERIFICATIONS - approvedCount} more citizen verifications`
      } else {
        message = `Average rating (${averageRating.toFixed(1)}/5) below required threshold (${MINIMUM_APPROVAL_RATING}/5)`
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          canRelease: false,
          approvedCount,
          requiredCount: REQUIRED_CITIZEN_VERIFICATIONS,
          averageRating,
          message 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 4. Get milestone details
    const { data: milestone, error: milestoneError } = await supabaseAdmin
      .from('project_milestones')
      .select('*')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      console.error('[AUTO-RELEASE] Milestone not found:', milestoneError)
      return new Response(
        JSON.stringify({ error: 'Milestone not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if already paid
    if (milestone.status === 'paid') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          alreadyPaid: true,
          message: 'Payment already released for this milestone' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 5. Get escrow account
    const { data: escrow, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .select('*')
      .eq('project_id', milestone.project_id)
      .single()

    if (escrowError || !escrow) {
      console.error('[AUTO-RELEASE] Escrow not found:', escrowError)
      return new Response(
        JSON.stringify({ error: 'Escrow account not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 6. Calculate payment amount
    const milestoneAmount = (escrow.total_amount * milestone.payment_percentage) / 100

    // Check sufficient funds
    if (escrow.held_amount < milestoneAmount) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Insufficient escrow funds',
          message: `Need KES ${milestoneAmount.toLocaleString()}, but only KES ${escrow.held_amount.toLocaleString()} available`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentRef = generatePaymentRef()
    console.log(`[AUTO-RELEASE] Releasing KES ${milestoneAmount} for milestone ${milestoneId}. Ref: ${paymentRef}`)

    // 7. Create payment transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        escrow_account_id: escrow.id,
        milestone_id: milestoneId,
        amount: milestoneAmount,
        transaction_type: 'release',
        payment_method: 'auto_citizen_verified',
        status: 'completed',
        stripe_transaction_id: paymentRef
      })
      .select()
      .single()

    if (txError) {
      console.error('[AUTO-RELEASE] Transaction error:', txError)
      throw txError
    }

    // 8. Update milestone status to 'paid'
    const { error: milestoneUpdateError } = await supabaseAdmin
      .from('project_milestones')
      .update({ 
        status: 'paid',
        verified_at: new Date().toISOString(),
        // verified_by is UUID, only set if we have a user ID
        ...(userId ? { verified_by: userId } : {})
      })
      .eq('id', milestoneId)

    if (milestoneUpdateError) {
      console.error('[AUTO-RELEASE] Milestone update error:', milestoneUpdateError)
    }

    // 9. Update escrow account
    const { error: escrowUpdateError } = await supabaseAdmin
      .from('escrow_accounts')
      .update({
        released_amount: escrow.released_amount + milestoneAmount,
        held_amount: escrow.held_amount - milestoneAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    if (escrowUpdateError) {
      console.error('[AUTO-RELEASE] Escrow update error:', escrowUpdateError)
    }

    // 10. Get contractor info for notification
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('contractor_id, title')
      .eq('id', milestone.project_id)
      .single()

    // 11. Create notifications for contractor
    if (project?.contractor_id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: project.contractor_id,
          title: '💰 Milestone Payment Released!',
          message: `KES ${milestoneAmount.toLocaleString()} has been automatically released for "${milestone.title}" after ${approvedCount} citizen verifications (Rating: ${averageRating.toFixed(1)}/5). Ref: ${paymentRef}`,
          type: 'success',
          category: 'payment',
          action_url: `/contractor/projects`
        })
    }

    // 12. Create realtime update for transparency
    await supabaseAdmin
      .from('realtime_project_updates')
      .insert({
        project_id: milestone.project_id,
        update_type: 'auto_payment_released',
        message: `💰 Automated payment of KES ${milestoneAmount.toLocaleString()} released for "${milestone.title}" after ${approvedCount} citizen verifications`,
        created_by: userId || project?.contractor_id || milestone.project_id, // Use any available ID
        metadata: {
          milestone_id: milestoneId,
          amount: milestoneAmount,
          reference: paymentRef,
          verifications: approvedCount,
          average_rating: averageRating,
          triggered_by: userId || 'system',
          auto_triggered: true
        }
      })

    console.log(`[AUTO-RELEASE] ✅ Payment released successfully. Transaction ID: ${transaction.id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        transaction: {
          id: transaction.id,
          amount: milestoneAmount,
          reference: paymentRef
        },
        verificationDetails: {
          approvedCount,
          requiredCount: REQUIRED_CITIZEN_VERIFICATIONS,
          averageRating
        },
        message: `🎉 Payment of KES ${milestoneAmount.toLocaleString()} automatically released! Reference: ${paymentRef}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[AUTO-RELEASE] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
