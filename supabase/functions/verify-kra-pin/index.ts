
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

    const { pin_number, taxpayer_name } = await req.json()

    // KRA API integration would go here
    // For now, we'll simulate the verification process
    const kraApiResponse = await simulateKRAVerification(pin_number, taxpayer_name)

    // Create verification record
    const { data: verification, error: verificationError } = await supabaseClient
      .from('verification_records')
      .insert({
        user_id: user.id,
        verification_type: 'kra_pin',
        reference_number: pin_number,
        status: kraApiResponse.status === 'active' ? 'verified' : 'failed',
        verification_data: kraApiResponse,
        verified_at: kraApiResponse.status === 'active' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (verificationError) {
      throw verificationError
    }

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'KRA PIN Verification',
        message: kraApiResponse.status === 'active' 
          ? `KRA PIN ${pin_number} verified successfully.`
          : `KRA PIN ${pin_number} verification failed.`,
        type: kraApiResponse.status === 'active' ? 'success' : 'error',
        category: 'verification'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        verification,
        message: 'KRA PIN verification completed' 
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

// Simulate KRA API response
async function simulateKRAVerification(pinNumber: string, taxpayerName: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate different responses based on PIN format
  if (pinNumber.match(/^P\d{9}[A-Z]$/)) {
    return {
      pin_number: pinNumber,
      taxpayer_name: taxpayerName,
      registration_date: '2018-03-15',
      status: 'active',
      compliance_status: 'compliant',
      last_return_date: '2024-06-30'
    }
  } else {
    return {
      pin_number: pinNumber,
      taxpayer_name: taxpayerName,
      status: 'inactive',
      compliance_status: 'non_compliant',
      error: 'Invalid PIN format or PIN not found'
    }
  }
}
