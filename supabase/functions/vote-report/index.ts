
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

    const { reportId, voteType } = await req.json()

    // Upsert vote (insert or update if exists)
    const { data: vote, error: voteError } = await supabaseClient
      .from('community_votes')
      .upsert({
        report_id: reportId,
        user_id: user.id,
        vote_type: voteType
      })
      .select()
      .single()

    if (voteError) {
      throw voteError
    }

    // Get updated vote counts
    const { data: voteCounts, error: countError } = await supabaseClient
      .from('community_votes')
      .select('vote_type')
      .eq('report_id', reportId)

    if (countError) {
      throw countError
    }

    const upvotes = voteCounts.filter(v => v.vote_type === 'upvote').length
    const downvotes = voteCounts.filter(v => v.vote_type === 'downvote').length

    return new Response(
      JSON.stringify({ 
        success: true, 
        vote,
        upvotes,
        downvotes,
        message: 'Vote recorded successfully' 
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
