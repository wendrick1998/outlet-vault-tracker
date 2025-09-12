import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { password } = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking password for leaks...');

    // Criar hash SHA-1 da senha
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Usar k-anonymity: enviar apenas os primeiros 5 caracteres do hash
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    console.log(`Hash prefix: ${prefix}`);

    // Verificar via HaveIBeenPwned API usando k-anonymity
    const hibpResponse = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Inventory-System-Security-Check'
      }
    });

    if (!hibpResponse.ok) {
      console.warn('HaveIBeenPwned API unavailable, allowing password');
      // Fallback: se a API estiver indisponível, permitir a senha
      return new Response(
        JSON.stringify({ 
          isLeaked: false, 
          message: 'Password check completed (external service unavailable)', 
          fallback: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await hibpResponse.text();
    const lines = responseText.split('\n');
    
    let isLeaked = false;
    let breachCount = 0;

    // Verificar se o sufixo do hash está na lista de hashes vazados
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix && hashSuffix.trim() === suffix) {
        isLeaked = true;
        breachCount = parseInt(count.trim(), 10);
        break;
      }
    }

    // Log da verificação (sem expor dados sensíveis)
    await supabase.rpc('log_audit_event', {
      p_action: 'password_leak_check',
      p_details: {
        is_leaked: isLeaked,
        breach_count: breachCount > 0 ? breachCount : null,
        api_available: true
      }
    });

    console.log(`Password check result: ${isLeaked ? 'LEAKED' : 'SAFE'}`);

    return new Response(
      JSON.stringify({
        isLeaked,
        breachCount: isLeaked ? breachCount : 0,
        message: isLeaked 
          ? `Esta senha foi encontrada em ${breachCount} vazamentos de dados. Por favor, escolha uma senha diferente.`
          : 'Senha segura - não encontrada em vazamentos conhecidos.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-leaked-passwords function:', error);
    
    // Fallback em caso de erro: não bloquear o usuário
    return new Response(
      JSON.stringify({ 
        isLeaked: false, 
        message: 'Password check completed (verification failed gracefully)', 
        error: 'Service temporarily unavailable',
        fallback: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});