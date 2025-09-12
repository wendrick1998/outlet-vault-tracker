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
    console.log('Bootstrap admin function called')
    
    // Create a Supabase client with the service role key
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

    const { email, password } = await req.json()
    
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    console.log(`Attempting to bootstrap admin for email: ${email}`)

    // First, try to delete any existing user with this email
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers.users?.find(u => u.email === email)
      
      if (existingUser) {
        console.log(`Found existing user ${existingUser.id}, deleting...`)
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
        
        // Also delete from profiles table
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', existingUser.id)
      }
    } catch (deleteError) {
      console.log('Error during cleanup (this is ok):', deleteError)
    }

    // Create new user
    console.log('Creating new admin user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Wendrick Admin'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    console.log(`User created with ID: ${authData.user.id}`)

    // Create admin profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: 'Wendrick Admin',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // If profile creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    console.log('Admin profile created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user_id: authData.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Bootstrap error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to bootstrap admin user'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})