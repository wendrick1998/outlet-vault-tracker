import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Connection': 'keep-alive'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate OpenAI API key presence
  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { type, period = '1d' } = await req.json();

    console.log(`AI Analytics Stream: ${type} analysis for ${period}`);

    // Create AbortController for cleanup
    const abortController = new AbortController();
    
    // Resposta streaming com progresso
    const readable = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let heartbeatInterval: number;
        
        // Setup heartbeat (ping every 15s)
        heartbeatInterval = setInterval(() => {
          if (!abortController.signal.aborted) {
            try {
              controller.enqueue(encoder.encode(`: ping\n\n`));
            } catch (error) {
              console.log('Heartbeat failed - connection closed');
              clearInterval(heartbeatInterval);
            }
          }
        }, 15000);
        
        // Cleanup on abort
        abortController.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          try {
            controller.close();
          } catch (e) {
            console.log('Controller already closed');
          }
        });
        
        // Resposta inicial imediata
        const jobId = crypto.randomUUID();
        
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
            // Early abort check
            if (abortController.signal.aborted) return;
            
            // Progresso: coletando dados
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'progress',
              jobId,
              progress: 25,
              message: 'Coletando dados do sistema...'
            })}\n\n`));

            // Buscar apenas dados essenciais (payload reduzido)
            const [inventoryData, loansData, customersData, sellersData] = await Promise.all([
              supabase.from('inventory').select('id, status, brand, model, created_at').limit(1000),
              supabase.from('loans').select('id, status, issued_at, due_at, returned_at').limit(1000),
              supabase.from('customers').select('id, is_registered, created_at').limit(1000),
              supabase.from('sellers').select('id, is_active, created_at').limit(1000)
            ]);

            if (abortController.signal.aborted) return;

            // Preparar contexto resumido para análise
            const systemContext = {
              summary: {
                totalItems: inventoryData.data?.length || 0,
                activeLoans: loansData.data?.filter(loan => loan.status === 'active').length || 0,
                totalCustomers: customersData.data?.length || 0,
                activeSellers: sellersData.data?.filter(seller => seller.is_active).length || 0
              },
              trends: {
                inventory_by_status: inventoryData.data?.reduce((acc: any, item: any) => {
                  acc[item.status] = (acc[item.status] || 0) + 1;
                  return acc;
                }, {}),
                loans_by_month: loansData.data?.filter((loan: any) => 
                  new Date(loan.issued_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length || 0
              }
            };

            if (abortController.signal.aborted) return;

            // Chamar OpenAI com timeout e abort controller
            const openAIController = new AbortController();
            const openAITimeout = setTimeout(() => openAIController.abort(), 30000); // 30s timeout

            try {

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
                  { role: 'system', content: 'Você é um analista especialista em sistemas de inventário. Forneça análises práticas e insights acionáveis em formato JSON estruturado.' },
                  { role: 'user', content: `Analise estes dados do sistema: ${JSON.stringify(systemContext)}. Tipo: ${type}. Período: ${period}. Responda em JSON com: insights (array), predictions (array), recommendations (array), summary (string curta).` }
                ],
                max_tokens: 800,
                temperature: 0.7,
              }),
              signal: openAIController.signal
            });

            clearTimeout(openAITimeout);
            
            if (abortController.signal.aborted) return;

            } catch (openAIError) {
              clearTimeout(openAITimeout);
              throw new Error(`OpenAI API error: ${openAIError.message}`);
            }

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`);
            }

            const aiData = await response.json();
            const aiAnalysis = aiData.choices[0].message.content;

            let analysis;
            try {
              // Try to parse as JSON first
              analysis = JSON.parse(aiAnalysis);
            } catch {
              // Fallback to structured format
              analysis = {
                insights: ["Análise gerada com sucesso"],
                predictions: ["Tendências identificadas"],
                recommendations: ["Recomendações disponíveis"],
                summary: aiAnalysis.substring(0, 200)
              };
            }

            if (abortController.signal.aborted) return;

            // Resposta final
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: 'completed',
              jobId,
              progress: 100,
              message: 'Análise concluída!',
              result: {
                analysis,
                dataPoints: systemContext.summary,
                period,
                timestamp: new Date().toISOString()
              }
            })}\n\n`));

            clearInterval(heartbeatInterval);
            controller.close();

          } catch (error) {
            console.error('Error in streaming analysis:', error);
            clearInterval(heartbeatInterval);
            
            if (!abortController.signal.aborted) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                status: 'error',
                jobId,
                progress: 100,
                message: 'Erro na análise. Tente novamente.',
                error: error.message
              })}\n\n`));
            }
            
            controller.close();
          }
        })();
      },
      
      cancel() {
        // Handle client disconnect
        abortController.abort();
        console.log('Stream cancelled by client');
      }
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
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