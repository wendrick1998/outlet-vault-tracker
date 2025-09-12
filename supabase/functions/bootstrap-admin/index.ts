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

    // Create or locate user
    console.log('Creating new admin user...')
    let userId: string | null = null;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Wendrick Admin' }
    })

    if (authError) {
      console.error('Auth error while creating user:', authError)
      // If user already exists, find their ID and reset password
      try {
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const existing = usersList.users?.find((u: any) => u.email === email)
        if (!existing) throw authError
        userId = existing.id
        console.log(`Existing user found: ${userId}, updating password and confirming email`)
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { full_name: 'Wendrick Admin' }
        })
        if (updateError) throw updateError
      } catch (fallbackError) {
        console.error('Fallback user lookup/update failed:', fallbackError)
        throw authError
      }
    } else {
      if (!authData.user) throw new Error('Failed to create user')
      userId = authData.user.id
      console.log(`User created with ID: ${userId}`)
    }

    // Upsert admin profile to avoid duplicates if a trigger already created it
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId as string,
        email: email,
        full_name: 'Wendrick Admin',
        role: 'admin',
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile error:', profileError)
      throw profileError
    }

    console.log('Admin profile created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user_id: userId
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