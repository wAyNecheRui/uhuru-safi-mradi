import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Demo mode - generate simulated escrow account ID
function generateDemoEscrowId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ESC${timestamp}${random}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role for admin operations
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

    const { project_id, total_amount, milestones } = await req.json()

    console.log(`[ESCROW-DEMO] Creating escrow account for project: ${project_id}, amount: ${total_amount}`)

    // Verify user is government official - use admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Only government users can create escrow accounts' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const demoEscrowRef = generateDemoEscrowId();

    // Create escrow account - use admin client
    const { data: escrowAccount, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .insert({
        project_id,
        total_amount,
        held_amount: total_amount,
        released_amount: 0,
        status: 'active',
        stripe_account_id: demoEscrowRef // Using as demo reference
      })
      .select()
      .single()

    if (escrowError) {
      throw escrowError
    }

    console.log(`[ESCROW-DEMO] Escrow account created: ${escrowAccount.id}`)

    // Check if milestones already exist for this project - prevent duplicates
    const { data: existingMilestones, error: checkError } = await supabaseAdmin
      .from('project_milestones')
      .select('id')
      .eq('project_id', project_id);

    let createdMilestones = [];
    
    // Only create milestones if none exist
    if (!checkError && (!existingMilestones || existingMilestones.length === 0)) {
      if (milestones && milestones.length > 0) {
        const milestonesData = milestones.map((milestone: any, index: number) => ({
          project_id,
          title: milestone.title || milestone.description || `Milestone ${index + 1}`,
          description: milestone.description || `Milestone ${index + 1}`,
          payment_percentage: milestone.payment_percentage,
          milestone_number: index + 1,
          status: 'pending',
          target_completion_date: milestone.target_date || null,
          completion_criteria: milestone.criteria || null
        }))

        const { data: milestonesResult, error: milestonesError } = await supabaseAdmin
          .from('project_milestones')
          .insert(milestonesData)
          .select()

        if (milestonesError) {
          console.error('[ESCROW-DEMO] Milestones creation error:', milestonesError)
        } else {
          createdMilestones = milestonesResult || [];
          console.log(`[ESCROW-DEMO] Created ${createdMilestones.length} milestones`)
        }
      }
    } else {
      console.log(`[ESCROW-DEMO] Skipping milestone creation - ${existingMilestones?.length || 0} milestones already exist`)
      createdMilestones = existingMilestones || [];
    }

    // Create notification - use admin client
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Escrow Account Created',
        message: `Demo: Escrow account created for project with KES ${total_amount.toLocaleString()}. Ref: ${demoEscrowRef}`,
        type: 'success',
        category: 'project'
      })

    // Create realtime update
    await supabaseAdmin
      .from('realtime_project_updates')
      .insert({
        project_id,
        update_type: 'escrow_created',
        message: `Demo: Escrow account set up with KES ${total_amount.toLocaleString()} budget`,
        created_by: user.id,
        metadata: {
          escrow_id: escrowAccount.id,
          total_amount,
          milestones_count: createdMilestones.length,
          demo_mode: true,
          reference: demoEscrowRef
        }
      })

    console.log(`[ESCROW-DEMO] Escrow setup complete with ${createdMilestones.length} milestones`)

    return new Response(
      JSON.stringify({ 
        success: true,
        demo_mode: true,
        escrowAccount: {
          ...escrowAccount,
          milestones: createdMilestones,
          reference: demoEscrowRef
        },
        message: 'Escrow account created successfully (Demo Mode)' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[ESCROW-DEMO] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
