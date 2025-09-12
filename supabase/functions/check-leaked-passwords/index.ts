import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Rate limiting cache (IP -> { count, resetTime })
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

// Cleanup expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitCache.entries()) {
    if (now > data.resetTime) {
      rateLimitCache.delete(ip);
    }
  }
}, 30000); // Cleanup every 30 seconds

// Helper function for retry with jitter
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    let rateLimitData = rateLimitCache.get(clientIP);
    if (!rateLimitData || now > rateLimitData.resetTime) {
      rateLimitData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      rateLimitCache.set(clientIP, rateLimitData);
    }
    
    rateLimitData.count++;
    
    if (rateLimitData.count > RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Por favor, aguarde antes de verificar novamente.',
          retry_after: Math.ceil((rateLimitData.resetTime - now) / 1000)
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } 
        }
      );
    }

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

    // Verificar via HaveIBeenPwned API usando k-anonymity com timeout e retry
    const hibpResponse = await fetchWithRetry(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true',
        'User-Agent': 'OutletStorePlus-SecurityCheck'
      }
    });

    if (!hibpResponse.ok) {
      console.warn(`HaveIBeenPwned API unavailable, status: ${hibpResponse.status}`);
      // Fallback gracioso: se a API estiver indisponível, permitir a senha
      return new Response(
        JSON.stringify({ 
          isLeaked: false, 
          message: 'Verificação de segurança temporariamente indisponível', 
          fallback: true,
          fallback_reason: 'hibp_service_unavailable'
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
    
    // Determinar tipo de erro para melhor fallback
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
    const fallback_reason = isTimeout ? 'timeout' : 'network_error';
    
    // Fallback em caso de erro: não bloquear o usuário
    return new Response(
      JSON.stringify({ 
        isLeaked: false, 
        message: isTimeout 
          ? 'Verificação de segurança demorou muito - senha aceita'
          : 'Verificação de segurança temporariamente indisponível',
        fallback: true,
        fallback_reason
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});