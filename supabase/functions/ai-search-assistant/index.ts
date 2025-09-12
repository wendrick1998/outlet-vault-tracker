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
    const { searchTerm, type = 'imei' } = await req.json();
    
    if (!searchTerm?.trim()) {
      return new Response(JSON.stringify({ 
        suggestions: [], 
        correctedTerm: null,
        confidence: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`AI Search: ${type} - "${searchTerm}"`);
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get current inventory data for context
    const { data: inventory } = await supabase
      .from('inventory')
      .select('imei, suffix, brand, model, color, storage, status')
      .limit(100);

    // Analyze search term with AI
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
            content: `Você é um assistente de busca inteligente para um sistema de inventário de celulares.
            
CONTEXTO DO INVENTÁRIO:
${JSON.stringify(inventory?.slice(0, 20) || [])}

Sua função é:
1. Corrigir erros de digitação no termo de busca
2. Sugerir termos similares baseado no inventário
3. Identificar o tipo de busca (IMEI, marca, modelo, etc.)
4. Fornecer sugestões relevantes

Responda SEMPRE em JSON com esta estrutura:
{
  "correctedTerm": "termo corrigido ou null",
  "suggestions": ["sugestão1", "sugestão2", "sugestão3"],
  "searchType": "imei|brand|model|general",
  "confidence": 0.0-1.0,
  "reasoning": "explicação breve"
}`
          },
          {
            role: 'user',
            content: `Analise o termo de busca: "${searchTerm}"
            Tipo de busca esperado: ${type}
            
            Forneça correções, sugestões e identifique padrões baseado no inventário disponível.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiResult = JSON.parse(aiData.choices[0].message.content);

    console.log('AI Analysis Result:', aiResult);

    // Perform enhanced search based on AI suggestions
    let searchResults = [];
    
    const searchTermToUse = aiResult.correctedTerm || searchTerm;
    
    if (aiResult.searchType === 'imei' || type === 'imei') {
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .or(`imei.ilike.%${searchTermToUse}%,suffix.ilike.%${searchTermToUse}%`)
        .limit(10);
      searchResults = data || [];
    } else if (aiResult.searchType === 'brand' || type === 'brand') {
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .ilike('brand', `%${searchTermToUse}%`)
        .limit(10);
      searchResults = data || [];
    } else if (aiResult.searchType === 'model' || type === 'model') {
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .ilike('model', `%${searchTermToUse}%`)
        .limit(10);
      searchResults = data || [];
    } else {
      // General search across multiple fields
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .or(`brand.ilike.%${searchTermToUse}%,model.ilike.%${searchTermToUse}%,color.ilike.%${searchTermToUse}%,imei.ilike.%${searchTermToUse}%,suffix.ilike.%${searchTermToUse}%`)
        .limit(10);
      searchResults = data || [];
    }

    return new Response(JSON.stringify({
      correctedTerm: aiResult.correctedTerm,
      suggestions: aiResult.suggestions,
      searchType: aiResult.searchType,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      results: searchResults,
      originalTerm: searchTerm
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in AI search assistant:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro no assistente de busca IA',
      details: error.message,
      suggestions: [],
      correctedTerm: null,
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});