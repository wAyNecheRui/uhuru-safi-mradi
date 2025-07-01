
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

    const { project_id, total_amount, milestones } = await req.json()

    // Create escrow account
    const { data: escrowAccount, error: escrowError } = await supabaseClient
      .from('escrow_accounts')
      .insert({
        project_id,
        total_amount,
        held_amount: total_amount,
        status: 'active'
      })
      .select()
      .single()

    if (escrowError) {
      throw escrowError
    }

    // Create milestones
    const milestonesWithEscrowId = milestones.map((milestone: any, index: number) => ({
      ...milestone,
      escrow_account_id: escrowAccount.id,
      milestone_number: index + 1
    }))

    const { data: createdMilestones, error: milestonesError } = await supabaseClient
      .from('project_milestones')
      .insert(milestonesWithEscrowId)
      .select()

    if (milestonesError) {
      throw milestonesError
    }

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Escrow Account Created',
        message: `Escrow account created for project with KES ${total_amount.toLocaleString()} in escrow.`,
        type: 'success',
        category: 'project'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        escrowAccount: {
          ...escrowAccount,
          milestones: createdMilestones
        },
        message: 'Escrow account created successfully' 
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
