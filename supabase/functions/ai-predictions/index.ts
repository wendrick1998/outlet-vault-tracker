import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const requestId = generateRequestId();
    const { type = 'stock_analysis', itemId, userId, period = '30d' } = await req.json();
    
    console.log(`AI Stock Intelligence [${requestId}]: ${type} analysis`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.log(`AI Stock Intelligence [${requestId}]: OpenAI API key not configured`);
      return new Response(JSON.stringify({ 
        error: 'Serviço de IA indisponível',
        code: 'missing_api_key',
        requestId,
        predictions: {
          predictions: [],
          insights: ['Análise de IA indisponível no preview. Funcionalidade disponível apenas em produção.'],
          nextActions: ['Configurar chave da OpenAI em produção'],
          confidence: 0,
          summary: 'Análise de inteligência de estoque indisponível no ambiente de preview'
        }
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Collect comprehensive stock and business data
    const [
      loansResponse,
      inventoryResponse,
      customersResponse,
      sellersResponse,
      auditResponse
    ] = await Promise.all([
      supabase.from('loans').select(`
        *,
        inventory(id, brand, model, color, storage, status),
        customers(name),
        sellers(name)
      `).order('created_at', { ascending: false }).limit(300),
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

    // Calculate stock metrics
    const stockMetrics = calculateStockMetrics(historicalData);

    let analysisPrompt = '';
    
    if (type === 'stock_analysis' || type === 'demand') {
      analysisPrompt = `
        ANÁLISE INTELIGENTE DE ESTOQUE - GESTÃO DE INVENTÁRIO MÓVEL
        
        Com base nos dados históricos, forneça análises específicas sobre:
        
        1. ALERTAS DE ESTOQUE BAIXO:
        - Identifique modelos específicos (marca + modelo + cor + armazenamento) com baixa quantidade
        - Considere rotatividade e demanda para determinar criticidade
        - Priorize por volume de saídas recentes
        
        2. RECOMENDAÇÕES DE COMPRA:
        - Sugira aparelhos específicos para compra baseado em:
          * Rotatividade alta vs estoque atual
          * Padrões de demanda sazonal
          * Margem de lucro estimada
        - Quantidades recomendadas por modelo
        
        3. ANÁLISE DE ROTATIVIDADE:
        - Modelos com maior giro de estoque
        - Itens parados há muito tempo
        - Tendências de crescimento/declínio por marca
        
        4. INSIGHTS DE NEGÓCIO:
        - Oportunidades de otimização de estoque
        - Previsão de demanda para próximos 15 dias
        - Alertas de sazonalidade
        
        MÉTRICAS CALCULADAS: ${JSON.stringify(stockMetrics)}
      `;
    } else if (type === 'purchase_recommendations') {
      analysisPrompt = `
        RECOMENDAÇÕES INTELIGENTES DE COMPRA
        
        Analise os dados e forneça recomendações específicas de compra:
        
        1. PRIORIDADE ALTA (Comprar URGENTE):
        - Modelos com alta rotatividade e estoque baixo
        - Aparelhos com demanda crescente
        
        2. PRIORIDADE MÉDIA (Comprar em 7-15 dias):
        - Modelos com rotatividade moderada
        - Reposição de estoque de segurança
        
        3. EVITAR COMPRAR:
        - Modelos com baixa rotatividade
        - Estoque alto vs demanda
        
        Para cada recomendação, inclua:
        - Marca, modelo, cor, armazenamento específicos
        - Quantidade sugerida
        - Justificativa baseada em dados
        - ROI estimado
        
        DADOS DE ESTOQUE: ${JSON.stringify(stockMetrics)}
      `;
    } else if (type === 'rotation_analysis') {
      analysisPrompt = `
        ANÁLISE DE ROTATIVIDADE DE ESTOQUE
        
        Forneça análise detalhada sobre:
        
        1. TOP PERFORMERS:
        - Modelos com maior velocidade de rotação
        - Tempo médio no estoque até saída
        - Margem de contribuição
        
        2. SLOW MOVERS:
        - Itens parados há mais tempo
        - Modelos com baixa demanda
        - Sugestões de liquidação
        
        3. TENDÊNCIAS:
        - Crescimento/declínio por categoria
        - Sazonalidade identificada
        - Comparação mês anterior
        
        DADOS: ${JSON.stringify(stockMetrics)}
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
            content: `Você é um especialista em gestão inteligente de estoque para loja de eletrônicos/celulares.

DADOS DISPONÍVEIS:
${JSON.stringify(historicalData, null, 2)}

INSTRUÇÕES:
- Foque em análises práticas e acionáveis
- Use dados reais dos históricos fornecidos
- Seja específico com marcas, modelos, cores e armazenamento
- Inclua probabilidades e timelines realistas
- Priorize ROI e lucratividade

Responda SEMPRE em JSON com esta estrutura exata:
{
  "predictions": [
    {
      "type": "low_stock_alert|purchase_recommendation|rotation_insight|business_opportunity",
      "item": "Marca Modelo Cor Armazenamento ou null para insights gerais",
      "prediction": "descrição específica da previsão/recomendação",
      "probability": 0.0-1.0,
      "timeline": "período específico (ex: próximos 5 dias)",
      "impact": "low|medium|high",
      "recommendation": "ação específica a tomar",
      "quantity": "número de unidades (se aplicável) ou null"
    }
  ],
  "insights": [
    "insight específico sobre o negócio",
    "tendência identificada nos dados"
  ],
  "nextActions": [
    "ação prática imediata",
    "planejamento de curto prazo"
  ],
  "confidence": 0.0-1.0,
  "summary": "resumo executivo das principais descobertas"
}`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI Stock Intelligence [${requestId}]: OpenAI API error: ${aiResponse.status} - ${errorText}`);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Limite de uso da IA atingido',
          code: 'insufficient_quota',
          requestId,
          predictions: {
            predictions: [],
            insights: ['Limite de uso da OpenAI atingido. Tente novamente mais tarde.'],
            nextActions: ['Aguardar reset do limite ou aumentar quota'],
            confidence: 0,
            summary: 'Análise temporariamente indisponível devido ao limite de uso'
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
    
    try {
      const predictions = JSON.parse(responseContent);

      console.log(`AI Stock Intelligence [${requestId}]: generated successfully`);

      return new Response(JSON.stringify({
        predictions,
        type,
        itemId,
        userId,
        period,
        stockMetrics,
        requestId,
        timestamp: new Date().toISOString(),
        dataPoints: {
          loans: historicalData.loans.length,
          inventory: historicalData.inventory.length,
          customers: historicalData.customers.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', responseContent);
      throw new Error('Invalid JSON response from AI');
    }

  } catch (error) {
    const requestId = generateRequestId();
    console.error(`AI Stock Intelligence [${requestId}]: Error - ${error.message}`);
    return new Response(JSON.stringify({ 
      error: 'Erro na análise inteligente de estoque',
      details: error.message,
      requestId,
      predictions: {
        predictions: [],
        insights: ['Erro temporário na análise. Tente novamente.'],
        nextActions: ['Verifique a conectividade e tente novamente'],
        confidence: 0,
        summary: 'Análise indisponível temporariamente'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to calculate stock metrics
function calculateStockMetrics(data: any) {
  const { inventory, loans } = data;
  
  // Group inventory by model combination
  const modelStats = inventory.reduce((acc: any, item: any) => {
    const key = `${item.brand}-${item.model}-${item.color}-${item.storage}`;
    if (!acc[key]) {
      acc[key] = {
        brand: item.brand,
        model: item.model,
        color: item.color,
        storage: item.storage,
        total: 0,
        available: 0,
        loaned: 0
      };
    }
    acc[key].total++;
    if (item.status === 'available') acc[key].available++;
    if (item.status === 'loaned') acc[key].loaned++;
    return acc;
  }, {});
  
  // Calculate rotation for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentLoans = loans.filter((loan: any) => 
    new Date(loan.created_at) >= thirtyDaysAgo
  );
  
  const modelRotation = recentLoans.reduce((acc: any, loan: any) => {
    if (loan.inventory) {
      const key = `${loan.inventory.brand}-${loan.inventory.model}-${loan.inventory.color}-${loan.inventory.storage}`;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});
  
  return {
    totalItems: inventory.length,
    availableItems: inventory.filter((i: any) => i.status === 'available').length,
    loanedItems: inventory.filter((i: any) => i.status === 'loaned').length,
    modelStats,
    modelRotation,
    recentLoansCount: recentLoans.length
  };
}