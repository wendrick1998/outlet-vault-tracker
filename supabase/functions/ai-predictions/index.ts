import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'demand', itemId, userId, period = '30d' } = await req.json();
    
    console.log(`AI Predictions: ${type} analysis`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Collect comprehensive historical data
    const [
      loansResponse,
      inventoryResponse,
      customersResponse,
      sellersResponse,
      auditResponse
    ] = await Promise.all([
      supabase.from('loans').select(`
        *,
        inventory(*),
        customers(*),
        sellers(*)
      `).order('created_at', { ascending: false }).limit(200),
      supabase.from('inventory').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('sellers').select('*'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
    ]);

    const historicalData = {
      loans: loansResponse.data || [],
      inventory: inventoryResponse.data || [],
      customers: customersResponse.data || [],
      sellers: sellersResponse.data || [],
      auditLogs: auditResponse.data || [],
      currentDate: new Date().toISOString(),
      period
    };

    let analysisPrompt = '';
    
    if (type === 'demand') {
      analysisPrompt = `
        Analise os dados históricos e preveja a demanda futura de itens.
        
        Forneça previsões para:
        1. Itens mais solicitados nos próximos 7 dias
        2. Padrões de demanda por dia da semana
        3. Sazonalidade identificada
        4. Recomendações de estoque
        
        Seja específico com marcas, modelos e quantidades.
      `;
    } else if (type === 'risk') {
      analysisPrompt = `
        Analise os riscos potenciais baseado nos dados históricos.
        
        Identifique:
        1. Clientes com maior risco de atraso
        2. Itens com maior probabilidade de problemas
        3. Padrões de comportamento suspeitos
        4. Alertas preventivos necessários
        
        Seja específico com nomes, itens e probabilidades.
      `;
    } else if (type === 'performance') {
      analysisPrompt = `
        Analise a performance operacional do sistema.
        
        Avalie:
        1. Eficiência de vendedores/funcionários
        2. Tempo médio de processos
        3. Gargalos identificados
        4. Oportunidades de melhoria
        
        Forneça métricas específicas e recomendações.
      `;
    } else if (type === 'item' && itemId) {
      const itemData = historicalData.inventory.find(item => item.id === itemId);
      const itemLoans = historicalData.loans.filter(loan => loan.item_id === itemId);
      
      analysisPrompt = `
        Analise especificamente este item: ${JSON.stringify(itemData)}
        Histórico de empréstimos: ${JSON.stringify(itemLoans)}
        
        Forneça:
        1. Padrão de uso deste item
        2. Previsão de próxima solicitação
        3. Risco de problemas
        4. Recomendações específicas
      `;
    }

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
            content: `Você é um especialista em análise preditiva para sistemas de inventário e empréstimos.

DADOS HISTÓRICOS:
${JSON.stringify(historicalData)}

INSTRUÇÕES:
- Use machine learning patterns para identificar tendências
- Seja específico com previsões e probabilidades
- Forneça insights acionáveis
- Use dados reais dos históricos fornecidos

Responda em JSON com esta estrutura:
{
  "predictions": [
    {
      "type": "demand|risk|performance|alert",
      "item": "nome do item ou null",
      "prediction": "descrição da previsão",
      "probability": 0.0-1.0,
      "timeline": "quando vai acontecer",
      "impact": "low|medium|high",
      "recommendation": "o que fazer"
    }
  ],
  "insights": [
    "insight1", "insight2"
  ],
  "nextActions": [
    "ação1", "ação2"
  ],
  "confidence": 0.0-1.0
}`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1200
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const predictions = JSON.parse(aiData.choices[0].message.content);

    console.log('AI Predictions generated successfully');

    return new Response(JSON.stringify({
      predictions,
      type,
      itemId,
      userId,
      period,
      timestamp: new Date().toISOString(),
      dataPoints: {
        loans: historicalData.loans.length,
        inventory: historicalData.inventory.length,
        customers: historicalData.customers.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI predictions:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro nas previsões de IA',
      details: error.message,
      predictions: {
        predictions: [],
        insights: [],
        nextActions: [],
        confidence: 0
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});