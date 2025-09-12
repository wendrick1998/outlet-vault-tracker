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
    console.log('First access function called')
    
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

    const { email, password, step } = await req.json()
    
    if (!email) {
      throw new Error('Email é obrigatório')
    }

    console.log(`First access for email: ${email}, step: ${step}`)

    // Step 1: Check if email exists and can set password
    if (!step || step === 'check_email') {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, must_change_password, is_active')
        .eq('email', email)
        .maybeSingle()

      if (profileError) {
        console.error('Error checking profile:', profileError)
        throw new Error('Erro ao verificar usuário')
      }

      if (!profile) {
        return new Response(
          JSON.stringify({ 
            error: 'Email não encontrado',
            details: 'Este email não está cadastrado no sistema. Entre em contato com o administrador.'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!profile.is_active) {
        return new Response(
          JSON.stringify({ 
            error: 'Conta inativa',
            details: 'Sua conta foi desativada. Entre em contato com o administrador.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!profile.must_change_password) {
        return new Response(
          JSON.stringify({ 
            error: 'Senha já definida',
            details: 'Este usuário já definiu sua senha. Use o login normal.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email válido para primeiro acesso',
          can_set_password: true,
          user_id: profile.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Set password for the user
    if (step === 'set_password') {
      if (!password) {
        throw new Error('Senha é obrigatória')
      }

      // Validate password strength
      const { data: validationResult, error: validationError } = await supabaseAdmin
        .rpc('validate_password_security', { password_text: password })

      if (validationError) {
        console.error('Password validation error:', validationError)
        throw new Error('Erro na validação da senha')
      }

      if (!validationResult.valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Senha não atende aos critérios de segurança',
            details: validationResult.errors || ['Senha muito fraca']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, must_change_password')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado')
      }

      if (!profile.must_change_password) {
        throw new Error('Este usuário já definiu sua senha')
      }

      // Get auth user by email
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers()
      const authUser = usersList.users?.find(u => u.email === email)

      if (!authUser) {
        throw new Error('Usuário de autenticação não encontrado')
      }

      // Update user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true
      })

      if (updateError) {
        console.error('Error updating password:', updateError)
        throw new Error('Erro ao definir senha')
      }

      // Update profile to mark password as set
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError)
        throw new Error('Erro ao atualizar perfil')
      }

      // Log audit event
      await supabaseAdmin.rpc('log_audit_event', {
        p_action: 'first_access_password_set',
        p_details: {
          user_id: profile.id,
          email: email
        }
      })

      console.log('Password set successfully for user:', profile.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Senha definida com sucesso',
          user_id: profile.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Etapa inválida')

  } catch (error) {
    console.error('First access error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro no primeiro acesso'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})