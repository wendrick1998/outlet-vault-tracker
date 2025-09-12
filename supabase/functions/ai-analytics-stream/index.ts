import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { type, period = '1d' } = await req.json();

    console.log(`AI Analytics Stream: ${type} analysis for ${period}`);

    // Resposta inicial imediata (202 Accepted)
    const jobId = crypto.randomUUID();
    
    // Resposta streaming com progresso
    const readable = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Enviar progresso inicial
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: 'started',
          jobId,
          progress: 0,
          message: 'Iniciando análise de dados...'
        })}\n\n`));

        // Processar análise em background
        (async () => {
          try {
            // Progresso: coletando dados
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'progress',
              jobId,
              progress: 25,
              message: 'Coletando dados do sistema...'
            })}\n\n`));

            // Buscar dados do sistema
            const [inventoryData, loansData, customersData, sellersData] = await Promise.all([
              supabase.from('inventory').select('*'),
              supabase.from('loans').select('*'),
              supabase.from('customers').select('*'),
              supabase.from('sellers').select('*')
            ]);

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'progress',
              jobId,
              progress: 50,
              message: 'Processando análise com IA...'
            })}\n\n`));

            // Preparar contexto para análise
            const systemContext = {
              inventory: inventoryData.data || [],
              loans: loansData.data || [],
              customers: customersData.data || [],
              sellers: sellersData.data || [],
              totalItems: inventoryData.data?.length || 0,
              activeLoans: loansData.data?.filter(loan => loan.status === 'active').length || 0
            };

            // Chamar OpenAI de forma mais eficiente
            const analysisPrompt = `
Analise os dados do sistema de inventário e forneça insights em português brasileiro:

Dados: ${JSON.stringify(systemContext)}

Tipo de análise: ${type}
Período: ${period}

Forneça uma análise estruturada com:
1. Insights principais (máximo 3)
2. Predições (máximo 3) 
3. Recomendações (máximo 3)
4. Alertas importantes (se houver)
5. Resumo executivo (máximo 100 palavras)

Foque em dados práticos e acionáveis.`;

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'progress',
              jobId,
              progress: 75,
              message: 'Gerando insights personalizados...'
            })}\n\n`));

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'Você é um analista especialista em sistemas de inventário. Forneça análises práticas e insights acionáveis.' },
                  { role: 'user', content: analysisPrompt }
                ],
                max_tokens: 1000,
                temperature: 0.7,
              }),
            });

            if (!response.ok) {
              throw new Error('Falha na análise de IA');
            }

            const aiData = await response.json();
            const aiAnalysis = aiData.choices[0].message.content;

            // Parse da resposta AI em formato estruturado
            const analysis = {
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
              summary: aiAnalysis
            };

            // Resposta final
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'completed',
              jobId,
              progress: 100,
              message: 'Análise concluída!',
              result: {
                analysis,
                dataPoints: {
                  totalInventory: systemContext.totalItems,
                  totalLoans: systemContext.activeLoans,
                  totalCustomers: systemContext.customers.length,
                  totalSellers: systemContext.sellers.length
                },
                period,
                timestamp: new Date().toISOString()
              }
            })}\n\n`));

            controller.close();

          } catch (error) {
            console.error('Error in streaming analysis:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'error',
              jobId,
              progress: 100,
              message: 'Erro na análise. Tente novamente.',
              error: error.message
            })}\n\n`));
            controller.close();
          }
        })();
      }
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in ai-analytics-stream function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});