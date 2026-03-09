import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_BODY_SIZE = 51200;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateDemoEscrowId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ESC${timestamp}${random}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: Reject non-POST methods
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

    const { project_id, total_amount, milestones } = body;

    // SECURITY: Validate project_id is a valid UUID
    if (!project_id || typeof project_id !== 'string' || !UUID_REGEX.test(project_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Validate total_amount
    if (typeof total_amount !== 'number' || total_amount <= 0 || !Number.isFinite(total_amount) || total_amount > 100_000_000_000) {
      return new Response(
        JSON.stringify({ error: 'Invalid total_amount: must be a positive number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[ESCROW] Creating escrow for project: ${project_id}, amount: ${total_amount}`)

    // SECURITY: Role check — government only
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type, full_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'government') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: government role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, budget, title, deleted_at')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (project.deleted_at) {
      return new Response(
        JSON.stringify({ error: 'Project has been deleted' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Prevent duplicate escrow accounts
    const { data: existingEscrow } = await supabaseAdmin
      .from('escrow_accounts')
      .select('id')
      .eq('project_id', project_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingEscrow) {
      return new Response(
        JSON.stringify({ error: 'Escrow account already exists for this project' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Escrow starts with held_amount=0 (unfunded), not total_amount.
    // Funds are added via C2B treasury deposit, not at creation.
    const demoEscrowRef = generateDemoEscrowId();

    const { data: escrowAccount, error: escrowError } = await supabaseAdmin
      .from('escrow_accounts')
      .insert({
        project_id,
        total_amount,
        held_amount: 0,
        released_amount: 0,
        status: 'active',
        stripe_account_id: demoEscrowRef
      })
      .select()
      .single()

    if (escrowError) {
      console.error('[ESCROW] Creation error:', escrowError)
      return new Response(
        JSON.stringify({ error: 'Failed to create escrow account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[ESCROW] Escrow account created: ${escrowAccount.id}`)

    // Create milestones if none exist
    const { data: existingMilestones } = await supabaseAdmin
      .from('project_milestones')
      .select('id')
      .eq('project_id', project_id);

    let createdMilestones: any[] = [];
    
    if (!existingMilestones || existingMilestones.length === 0) {
      if (milestones && Array.isArray(milestones) && milestones.length > 0 && milestones.length <= 20) {
        // SECURITY: Validate milestone percentages sum to ~100
        const totalPercentage = milestones.reduce((sum: number, m: any) => sum + (Number(m.payment_percentage) || 0), 0);
        if (totalPercentage < 99 || totalPercentage > 101) {
          return new Response(
            JSON.stringify({ error: `Milestone percentages must sum to 100, got ${totalPercentage}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const milestonesData = milestones.map((milestone: any, index: number) => ({
          project_id,
          title: String(milestone.title || milestone.description || `Milestone ${index + 1}`).slice(0, 200),
          description: String(milestone.description || `Milestone ${index + 1}`).slice(0, 2000),
          payment_percentage: Number(milestone.payment_percentage),
          milestone_number: index + 1,
          status: 'pending',
          target_completion_date: milestone.target_date || null,
          completion_criteria: milestone.criteria ? String(milestone.criteria).slice(0, 2000) : null
        }))

        const { data: milestonesResult, error: milestonesError } = await supabaseAdmin
          .from('project_milestones')
          .insert(milestonesData)
          .select()

        if (milestonesError) {
          console.error('[ESCROW] Milestones creation error:', milestonesError)
        } else {
          createdMilestones = milestonesResult || [];
        }
      }
    } else {
      createdMilestones = existingMilestones || [];
    }

    // Notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Escrow Account Created',
        message: `Escrow account created for project with KES ${total_amount.toLocaleString()}. Ref: ${demoEscrowRef}. Awaiting treasury funding.`,
        type: 'success',
        category: 'project'
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        escrowAccount: {
          ...escrowAccount,
          milestones: createdMilestones,
          reference: demoEscrowRef
        },
        message: 'Escrow account created successfully. Awaiting treasury funding.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[ESCROW] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})