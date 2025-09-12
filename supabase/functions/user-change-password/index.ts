import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify request authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { new_password, current_password } = await req.json();

    if (!new_password) {
      return new Response(
        JSON.stringify({ error: 'Nova senha é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    const { data: rateLimitResult } = await supabaseAdmin.rpc('check_rate_limit', {
      identifier: `password_change_${user.id}`,
      max_requests: 10,
      window_minutes: 60
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas de alteração de senha. Tente novamente mais tarde.',
          reset_time: rateLimitResult.reset_time
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    const { data: validationResult, error: validationError } = await supabaseAdmin
      .rpc('validate_password_security', { password_text: new_password });

    if (validationError) {
      console.error('Password validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Erro na validação da senha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Senha não atende aos critérios de segurança',
          details: validationResult.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for leaked passwords using edge function
    try {
      const { data: leakResult, error: leakError } = await supabaseAdmin.functions.invoke(
        'check-leaked-passwords',
        {
          body: { password: new_password },
          headers: {
            Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          }
        }
      );

      if (!leakError && leakResult?.isLeaked) {
        return new Response(
          JSON.stringify({ 
            error: 'Esta senha foi encontrada em vazamentos de dados conhecidos. Por favor, escolha uma senha diferente.',
            leaked: true,
            breach_count: leakResult.breachCount
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (leakCheckError) {
      console.warn('Leak check failed, proceeding without check:', leakCheckError);
      // Continue without blocking - graceful degradation
    }

    // Check password reuse (last 5 passwords)
    const passwordHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(new_password)
    );
    const hashHex = Array.from(new Uint8Array(passwordHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const { data: recentPasswords } = await supabaseAdmin
      .from('password_history')
      .select('password_hash')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentPasswords?.some(p => p.password_hash === hashHex)) {
      return new Response(
        JSON.stringify({ error: 'Não é possível reutilizar uma das últimas 5 senhas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha no sistema de autenticação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile - clear must_change_password flag
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        must_change_password: false,
        senha_alterada_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar perfil do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store password hash in history
    const { error: historyError } = await supabaseAdmin
      .from('password_history')
      .insert({
        user_id: user.id,
        password_hash: hashHex
      });

    if (historyError) {
      console.error('Password history error:', historyError);
      // Don't fail the request for history issues
    }

    // Clean up old password history (keep only last 5)
    const { data: oldPasswords } = await supabaseAdmin
      .from('password_history')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(5, 1000);

    if (oldPasswords && oldPasswords.length > 0) {
      await supabaseAdmin
        .from('password_history')
        .delete()
        .in('id', oldPasswords.map(p => p.id));
    }

    // Log audit events
    await supabaseAdmin.rpc('log_password_security_event', {
      p_user_id: user.id,
      p_event_type: 'user_password_changed',
      p_details: {
        timestamp: new Date().toISOString(),
        is_mandatory_change: current_password ? false : true
      }
    });

    return new Response(
      JSON.stringify({ 
        message: 'Senha alterada com sucesso!'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in user-change-password:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
