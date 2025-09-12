import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting store
const rateLimitStore = new Map();

const checkRateLimit = (userId: string, ip: string) => {
  const key = `${userId || ip}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 5;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, resetTime: now + windowMs };
  }
  
  const record = rateLimitStore.get(key);
  
  if (now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, resetTime: now + windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, resetTime: record.resetTime };
};

const generateRequestId = () => crypto.randomUUID();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  
  try {
    const { type = 'general', period = '7d' } = await req.json();
    
    // Rate limiting
    const userId = req.headers.get('authorization')?.replace('Bearer ', '') || '';
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(userId, ip);
    
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      console.log(`AI Analytics [${requestId}]: Rate limited - retry after ${retryAfter}s`);
      
      return new Response(JSON.stringify({
        status: 'rate_limited',
        message: `Muitas solicitações. Tente novamente em ${retryAfter}s`,
        requestId,
        retryAfter
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString()
        }
      });
    }
    
    console.log(`AI Analytics [${requestId}]: ${type} analysis for ${period}`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.log(`AI Analytics [${requestId}]: OpenAI API key not configured`);
      return new Response(JSON.stringify({ 
        error: 'Serviço de IA indisponível',
        code: 'missing_api_key',
        requestId,
        analysis: {
          insights: {
            patterns: [],
            predictions: [],
            recommendations: [],
            alerts: []
          },
          metrics: {
            utilizationTrend: "stable",
            demandForecast: "medium",
            riskLevel: "low"
          },
          summary: "Análise de IA indisponível no preview. Funcionalidade disponível apenas em produção."
        }
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Collect comprehensive data based on period
    const periodCondition = period === '30d' ? "created_at >= NOW() - INTERVAL '30 days'" :
                            period === '7d' ? "created_at >= NOW() - INTERVAL '7 days'" :
                            "created_at >= NOW() - INTERVAL '1 day'";

    const [
      statsResponse,
      inventoryResponse, 
      loansResponse,
      customersResponse,
      sellersResponse,
      auditResponse
    ] = await Promise.all([
      supabase.rpc('get_system_stats'),
      supabase.from('inventory').select('*'),
      supabase.from('loans').select('*, inventory(*), customers(*), sellers(*)')
        .order('created_at', { ascending: false }).limit(100),
      supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('sellers').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
    ]);

    const analyticsData = {
      stats: statsResponse.data,
      inventory: inventoryResponse.data,
      loans: loansResponse.data,
      customers: customersResponse.data,
      sellers: sellersResponse.data,
      auditLogs: auditResponse.data,
      period,
      timestamp: new Date().toISOString()
    };

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um analista de dados IA especializado em sistemas de inventário e empréstimos.

DADOS PARA ANÁLISE:
${JSON.stringify(analyticsData)}

Analise os dados e forneça insights inteligentes sobre:

1. PADRÕES DE USO:
   - Quais itens são mais solicitados
   - Horários/dias de maior movimento
   - Comportamento de usuários

2. PREVISÕES:
   - Tendências de demanda
   - Possíveis gargalos
   - Itens que podem precisar de atenção

3. RECOMENDAÇÕES:
   - Otimizações operacionais
   - Ações preventivas
   - Melhorias de processo

4. ALERTAS:
   - Problemas identificados
   - Riscos potenciais
   - Anomalias detectadas

Responda em JSON com esta estrutura:
{
  "insights": {
    "patterns": ["padrão1", "padrão2"],
    "predictions": ["previsão1", "previsão2"],
    "recommendations": ["recomendação1", "recomendação2"],
    "alerts": ["alerta1", "alerta2"]
  },
  "metrics": {
    "utilizationTrend": "up|down|stable",
    "demandForecast": "high|medium|low",
    "riskLevel": "low|medium|high"
  },
  "summary": "resumo executivo dos insights"
}

Seja preciso, actionável e baseado nos dados reais fornecidos.`
          },
          {
            role: 'user',
            content: `Analise os dados do período de ${period} e forneça insights do tipo ${type}.
            
            Foque em padrões, tendências e recomendações práticas para melhorar a operação.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI Analytics [${requestId}]: OpenAI API error: ${aiResponse.status} - ${errorText}`);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Limite de uso da IA atingido',
          code: 'insufficient_quota',
          requestId,
          analysis: {
            insights: {
              patterns: [],
              predictions: [],
              recommendations: [],
              alerts: []
            },
            metrics: {
              utilizationTrend: "stable",
              demandForecast: "medium",
              riskLevel: "low"
            },
            summary: "Limite de uso da OpenAI atingido. Tente novamente mais tarde."
          }
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let responseContent = aiData.choices[0].message.content;
    
    // Remove markdown code blocks if present
    responseContent = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const analysis = JSON.parse(responseContent);

    console.log(`AI Analytics [${requestId}]: completed successfully`);

    return new Response(JSON.stringify({
      analysis,
      dataPoints: {
        totalInventory: analyticsData.inventory?.length || 0,
        totalLoans: analyticsData.loans?.length || 0,
        totalCustomers: analyticsData.customers?.length || 0,
        totalSellers: analyticsData.sellers?.length || 0
      },
      period,
      requestId,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const requestId = generateRequestId();
    console.error(`AI Analytics [${requestId}]: Error - ${error.message}`);
    return new Response(JSON.stringify({ 
      error: 'Erro na análise de IA',
      details: error.message,
      requestId,
      analysis: {
        insights: {
          patterns: [],
          predictions: [],
          recommendations: [],
          alerts: []
        },
        metrics: {
          utilizationTrend: "stable",
          demandForecast: "medium",
          riskLevel: "low"
        },
        summary: "Análise indisponível devido a erro técnico."
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});