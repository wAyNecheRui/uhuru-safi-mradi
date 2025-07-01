
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

    const reportData = await req.json()

    // Insert the problem report
    const { data: report, error: reportError } = await supabaseClient
      .from('problem_reports')
      .insert({
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        priority: reportData.priority,
        location: reportData.location,
        coordinates: reportData.coordinates,
        estimated_cost: reportData.estimatedCost,
        affected_population: reportData.affectedPopulation,
        reported_by: user.id
      })
      .select()
      .single()

    if (reportError) {
      throw reportError
    }

    // Create notification for government users
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Report Submitted Successfully',
        message: `Your report "${reportData.title}" has been submitted for review.`,
        type: 'success',
        category: 'report'
      })

    if (notificationError) {
      console.error('Notification error:', notificationError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report,
        message: 'Report submitted successfully' 
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
