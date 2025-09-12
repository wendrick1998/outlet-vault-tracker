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
    const { message, context, userId } = await req.json();
    
    console.log(`AI Chatbot: User ${userId} - "${message}"`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get system context
    const [statsResponse, inventoryResponse, loansResponse] = await Promise.all([
      supabase.rpc('get_system_stats'),
      supabase.from('inventory').select('*').limit(5),
      supabase.from('loans').select('*, inventory(*), customers(*), sellers(*)').eq('status', 'active').limit(5)
    ]);

    const systemContext = {
      stats: statsResponse.data,
      recentInventory: inventoryResponse.data,
      activeLoans: loansResponse.data,
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
            content: `Você é o assistente IA do sistema Cofre Tracker, um sistema de gestão de inventário de celulares e empréstimos.

CONTEXTO DO SISTEMA:
${JSON.stringify(systemContext)}

SUAS FUNÇÕES:
1. Responder dúvidas sobre o sistema
2. Explicar funcionalidades e processos
3. Ajudar com interpretação de dados e métricas
4. Sugerir ações baseadas no contexto atual
5. Guiar usuários através de processos

DIRETRIZES:
- Seja conciso e direto
- Use linguagem amigável e profissional
- Forneça exemplos práticos quando relevante
- Se não souber algo específico, seja honesto
- Sempre contextualize suas respostas com os dados atuais
- Use emojis relevantes para tornar a comunicação mais amigável

DADOS ATUAIS DO SISTEMA:
- Total de itens: ${systemContext.stats?.inventory?.total || 0}
- Itens disponíveis: ${systemContext.stats?.inventory?.available || 0}
- Empréstimos ativos: ${systemContext.stats?.loans?.active || 0}
- Taxa de utilização: ${systemContext.stats?.inventory?.utilizationRate || 0}%

Responda sempre em português brasileiro.`
          },
          ...(context || []),
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const botResponse = aiData.choices[0].message.content;

    console.log('AI Response generated successfully');

    // Log the interaction for analytics
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_chat_interaction',
      details: {
        user_message: message,
        bot_response: botResponse,
        context_provided: !!context,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      response: botResponse,
      timestamp: new Date().toISOString(),
      context: systemContext
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI chatbot:', error);
    return new Response(JSON.stringify({ 
      response: '😔 Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});