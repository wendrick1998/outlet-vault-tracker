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
    const { action, context, userId, itemData, formData } = await req.json();
    
    console.log(`AI Smart Actions: ${action} for user ${userId}`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user context
    const [userProfile, recentLoans, inventoryStats] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('loans').select('*, inventory(*), customers(*)')
        .eq('status', 'active').limit(10),
      supabase.rpc('get_system_stats')
    ]);

    const contextData = {
      user: userProfile.data,
      recentLoans: recentLoans.data,
      stats: inventoryStats.data,
      currentContext: context,
      itemData,
      formData,
      timestamp: new Date().toISOString()
    };

    let actionPrompt = '';
    
    switch (action) {
      case 'suggest_customer':
        actionPrompt = `
          Baseado no item ${itemData?.brand} ${itemData?.model} e no histórico,
          sugira o melhor cliente para este empréstimo.
          
          Considere:
          - Histórico de devoluções pontuais
          - Tipo de item solicitado anteriormente
          - Relacionamento com vendedores
          
          Retorne top 3 sugestões com razões.
        `;
        break;
        
      case 'suggest_seller':
        actionPrompt = `
          Para este empréstimo, sugira o vendedor mais adequado.
          
          Considere:
          - Especialidade em ${itemData?.brand}
          - Performance histórica
          - Disponibilidade atual
          
          Retorne sugestão com justificativa.
        `;
        break;
        
      case 'validate_loan':
        actionPrompt = `
          Valide este empréstimo antes de aprovar:
          
          Item: ${itemData?.brand} ${itemData?.model}
          Contexto: ${JSON.stringify(formData)}
          
          Verifique:
          - Disponibilidade real do item
          - Histórico do cliente/vendedor
          - Riscos potenciais
          - Conflitos de agenda
          
          Retorne validação com score de confiança.
        `;
        break;
        
      case 'auto_fill':
        actionPrompt = `
          Preencha automaticamente campos faltantes do formulário:
          
          Dados atuais: ${JSON.stringify(formData)}
          Item: ${itemData?.brand} ${itemData?.model}
          
          Complete com dados inteligentes baseados em:
          - Padrões históricos similares
          - Valores mais comuns
          - Configurações do usuário
          
          Retorne campos preenchidos.
        `;
        break;
        
      case 'suggest_return_date':
        actionPrompt = `
          Sugira data de devolução ideal para:
          
          Item: ${itemData?.brand} ${itemData?.model}
          Cliente: ${formData?.customer}
          
          Considere:
          - Histórico de devoluções deste tipo de item
          - Padrão do cliente
          - Demanda futura prevista
          
          Sugira data ótima com explicação.
        `;
        break;
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
            content: `Você é um assistente de ações inteligentes para o sistema Cofre Tracker.

CONTEXTO DO SISTEMA:
${JSON.stringify(contextData)}

Você deve fornecer sugestões práticas e acionáveis baseadas nos dados reais.

Responda em JSON com estrutura apropriada para cada ação:

Para suggest_customer/suggest_seller:
{
  "suggestions": [
    {
      "id": "id_do_cliente_ou_vendedor",
      "name": "nome",
      "reason": "por que é a melhor opção",
      "confidence": 0.0-1.0,
      "riskLevel": "low|medium|high"
    }
  ]
}

Para validate_loan:
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "risks": ["risco1", "risco2"],
  "recommendations": ["rec1", "rec2"],
  "autoActions": ["ação1", "ação2"]
}

Para auto_fill:
{
  "filledFields": {
    "campo1": "valor1",
    "campo2": "valor2"
  },
  "confidence": 0.0-1.0,
  "reasoning": "explicação das escolhas"
}

Para suggest_return_date:
{
  "suggestedDate": "YYYY-MM-DD",
  "reasoning": "explicação da data",
  "alternatives": [
    {"date": "YYYY-MM-DD", "reason": "motivo"}
  ]
}`
          },
          {
            role: 'user',
            content: actionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const smartAction = JSON.parse(aiData.choices[0].message.content);

    console.log('Smart action generated successfully');

    // Log the action for analytics
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_smart_action',
      details: {
        actionType: action,
        result: smartAction,
        context: context,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      action,
      result: smartAction,
      userId,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI smart actions:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro nas ações inteligentes',
      details: error.message,
      result: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});