import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Apple models catalog with all combinations
const APPLE_MODELS_CATALOG = [
  { "brand": "Apple", "model": "iPhone 8", "storages": [64,128,256], "colors": ["Prateado","Cinza-espacial","Dourado","(PRODUCT)RED"] },
  { "brand": "Apple", "model": "iPhone 8 Plus", "storages": [64,128,256], "colors": ["Prateado","Cinza-espacial","Dourado","(PRODUCT)RED"] },
  { "brand": "Apple", "model": "iPhone X", "storages": [64,256], "colors": ["Prateado","Cinza-espacial"] },
  { "brand": "Apple", "model": "iPhone XR", "storages": [64,128,256], "colors": ["Branco","Preto","Azul","Amarelo","Coral","(PRODUCT)RED"] },
  { "brand": "Apple", "model": "iPhone XS", "storages": [64,256,512], "colors": ["Prateado","Cinza-espacial","Dourado"] },
  { "brand": "Apple", "model": "iPhone XS Max", "storages": [64,256,512], "colors": ["Prateado","Cinza-espacial","Dourado"] },
  
  { "brand": "Apple", "model": "iPhone 11", "storages": [64,128,256], "colors": ["Preto","Branco","Amarelo","Verde","Roxo","(PRODUCT)RED"] },
  { "brand": "Apple", "model": "iPhone 11 Pro", "storages": [64,256,512], "colors": ["Cinza-espacial","Prateado","Dourado","Verde-meia-noite"] },
  { "brand": "Apple", "model": "iPhone 11 Pro Max", "storages": [64,256,512], "colors": ["Cinza-espacial","Prateado","Dourado","Verde-meia-noite"] },
  
  { "brand": "Apple", "model": "iPhone SE (2ª geração)", "storages": [64,128,256], "colors": ["Preto","Branco","(PRODUCT)RED"] },
  
  { "brand": "Apple", "model": "iPhone 12", "storages": [64,128,256], "colors": ["Preto","Branco","(PRODUCT)RED","Verde","Azul","Roxo"] },
  { "brand": "Apple", "model": "iPhone 12 Pro", "storages": [128,256,512], "colors": ["Prateado","Grafite","Dourado","Azul-pacífico"] },
  { "brand": "Apple", "model": "iPhone 12 Pro Max", "storages": [128,256,512], "colors": ["Prateado","Grafite","Dourado","Azul-pacífico"] },
  
  { "brand": "Apple", "model": "iPhone 13", "storages": [128,256,512], "colors": ["Meia-noite","Estelar","Azul","Rosa","Verde","(PRODUCT)RED"] },
  { "brand": "Apple", "model": "iPhone 13 Pro", "storages": [128,256,512,1024], "colors": ["Grafite","Prateado","Dourado","Azul-sierra","Verde-alpino"] },
  { "brand": "Apple", "model": "iPhone 13 Pro Max", "storages": [128,256,512,1024], "colors": ["Grafite","Prateado","Dourado","Azul-sierra","Verde-alpino"] },
  
  { "brand": "Apple", "model": "iPhone SE (3ª geração)", "storages": [64,128,256], "colors": ["Meia-noite","Estelar","(PRODUCT)RED"] },
  
  { "brand": "Apple", "model": "iPhone 14", "storages": [128,256,512], "colors": ["Azul","Roxo","Meia-noite","Estelar","Amarelo","(PRODUCT)RED"] },
  { "brand": "Apple", "model": "iPhone 14 Plus", "storages": [128,256,512], "colors": ["Azul","Roxo","Meia-noite","Estelar","Amarelo","(PRODUCT)RED"] },
  { "brand": "Apple", "model": "iPhone 14 Pro", "storages": [128,256,512,1024], "colors": ["Preto-espacial","Prata","Dourado","Roxo-profundo"] },
  { "brand": "Apple", "model": "iPhone 14 Pro Max", "storages": [128,256,512,1024], "colors": ["Preto-espacial","Prata","Dourado","Roxo-profundo"] },
  
  { "brand": "Apple", "model": "iPhone 15", "storages": [128,256,512], "colors": ["Preto","Azul","Verde","Amarelo","Rosa"] },
  { "brand": "Apple", "model": "iPhone 15 Plus", "storages": [128,256,512], "colors": ["Preto","Azul","Verde","Amarelo","Rosa"] },
  { "brand": "Apple", "model": "iPhone 15 Pro", "storages": [128,256,512,1024], "colors": ["Titânio preto","Titânio branco","Titânio azul","Titânio natural"] },
  { "brand": "Apple", "model": "iPhone 15 Pro Max", "storages": [256,512,1024], "colors": ["Titânio preto","Titânio branco","Titânio azul","Titânio natural"] },
  
  { "brand": "Apple", "model": "iPhone 16", "storages": [128], "colors": ["Ultramarino","Verde-acinzentado","Rosa","Branco","Preto"] },
  { "brand": "Apple", "model": "iPhone 16 Plus", "storages": [128,256], "colors": ["Ultramarino","Verde-acinzentado","Rosa","Branco","Preto"] },
  { "brand": "Apple", "model": "iPhone 16 Pro", "storages": [256,512,1024], "colors": ["Titânio-deserto","Titânio natural","Titânio branco","Titânio preto"] },
  { "brand": "Apple", "model": "iPhone 16 Pro Max", "storages": [256,512,1024], "colors": ["Titânio-deserto","Titânio natural","Titânio branco","Titânio preto"] },
  
  { "brand": "Apple", "model": "iPhone 17", "storages": [256,512], "colors": ["Preto","Branco-acinzentado","Rosa","Azul-claro","Verde-claro"] },
  { "brand": "Apple", "model": "iPhone Air", "storages": [256,512], "colors": ["Dourado-claro","Titânio-galático","Cinza-anelar"] },
  { "brand": "Apple", "model": "iPhone 17 Pro", "storages": [256,512,1024], "colors": ["Laranja-cósmico","Azul-intenso","Prateado"] },
  { "brand": "Apple", "model": "iPhone 17 Pro Max", "storages": [256,512,1024,2048], "colors": ["Laranja-cósmico","Azul-intenso","Prateado"] }
];

// Utility function to generate slug from brand and model
function generateSlug(brand: string, model: string): string {
  return (brand.toLowerCase() + '-' + model.toLowerCase())
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Function to normalize storage from text (G, GB, gb) to numeric
export function normalizeStorage(storageText: string): number | null {
  if (!storageText) return null;
  
  const normalized = storageText.toString().toLowerCase()
    .replace(/[^0-9]/g, '');
  
  const num = parseInt(normalized);
  return isNaN(num) ? null : num;
}

// Function to normalize color names (handles accents, hyphens, synonyms)
export function normalizeColor(colorText: string): string {
  if (!colorText) return colorText;
  
  const colorMap: { [key: string]: string } = {
    'cinza espacial': 'Cinza-espacial',
    'azul pacifico': 'Azul-pacífico',
    'meia noite': 'Meia-noite',
    'preto espacial': 'Preto-espacial',
    'prata': 'Prateado',
    'verde meia noite': 'Verde-meia-noite',
    'verde meia-noite': 'Verde-meia-noite',
    'azul sierra': 'Azul-sierra',
    'verde alpino': 'Verde-alpino',
    'roxo profundo': 'Roxo-profundo',
    'titanio preto': 'Titânio preto',
    'titanio branco': 'Titânio branco',
    'titanio azul': 'Titânio azul',
    'titanio natural': 'Titânio natural',
    'titanio deserto': 'Titânio-deserto',
    'branco acinzentado': 'Branco-acinzentado',
    'verde acinzentado': 'Verde-acinzentado',
    'azul claro': 'Azul-claro',
    'verde claro': 'Verde-claro',
    'dourado claro': 'Dourado-claro',
    'titanio galatico': 'Titânio-galático',
    'cinza anelar': 'Cinza-anelar',
    'laranja cosmico': 'Laranja-cósmico',
    'azul intenso': 'Azul-intenso'
  };
  
  const normalized = colorText.toLowerCase().trim();
  return colorMap[normalized] || colorText;
}

// Function to match model name from import text
export function matchAppleModel(inputText: string): { brand: string; model: string; storage?: number; color?: string } | null {
  if (!inputText) return null;
  
  const input = inputText.toLowerCase().trim();
  
  // Find matching model
  for (const modelData of APPLE_MODELS_CATALOG) {
    const modelLower = modelData.model.toLowerCase();
    
    if (input.includes(modelLower)) {
      // Extract storage
      const storageMatch = input.match(/(\d+)\s*g/i);
      const storage = storageMatch ? parseInt(storageMatch[1]) : undefined;
      
      // Extract color (basic attempt)
      let color: string | undefined;
      for (const colorOption of modelData.colors) {
        const colorLower = colorOption.toLowerCase();
        if (input.includes(colorLower)) {
          color = colorOption;
          break;
        }
      }
      
      return {
        brand: modelData.brand,
        model: modelData.model,
        storage,
        color
      };
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Apple models seed process...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    const currentVersion = new Date().toISOString();
    
    console.log(`📦 Processing ${APPLE_MODELS_CATALOG.length} Apple models...`)
    
    // Process each model with upsert (idempotent)
    for (const modelData of APPLE_MODELS_CATALOG) {
      const slug = generateSlug(modelData.brand, modelData.model);
      
      console.log(`📱 Processing: ${modelData.brand} ${modelData.model}`)
      
      // Check if model exists
      const { data: existingModel } = await supabase
        .from('device_models')
        .select('id, seed_version')
        .eq('slug', slug)
        .single();
      
      const modelPayload = {
        brand: modelData.brand,
        model: modelData.model,
        supported_storage: modelData.storages,
        available_colors: modelData.colors,
        is_active: true,
        slug: slug,
        seed_source: 'apple-catalog',
        seed_version: currentVersion,
        notes: `Catálogo oficial Apple - ${modelData.storages.length} capacidades, ${modelData.colors.length} cores`
      };
      
      if (existingModel) {
        // Update existing model
        const { error } = await supabase
          .from('device_models')
          .update(modelPayload)
          .eq('slug', slug);
        
        if (error) {
          console.error(`❌ Error updating ${modelData.model}:`, error.message);
        } else {
          console.log(`✅ Updated: ${modelData.model}`);
          updatedCount++;
        }
      } else {
        // Create new model
        const { error } = await supabase
          .from('device_models')
          .insert(modelPayload);
        
        if (error) {
          console.error(`❌ Error creating ${modelData.model}:`, error.message);
        } else {
          console.log(`🆕 Created: ${modelData.model}`);
          createdCount++;
        }
      }
      
      processedCount++;
    }
    
    // Log audit event
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: null, // System operation
        action: 'apple_models_seed',
        details: {
          processed_count: processedCount,
          created_count: createdCount,
          updated_count: updatedCount,
          seed_version: currentVersion,
          source: 'edge-function'
        },
        table_name: 'device_models'
      });
    
    if (auditError) {
      console.error('❌ Audit log error:', auditError.message);
    }
    
    const result = {
      success: true,
      message: `Catálogo Apple processado com sucesso!`,
      details: {
        processed: processedCount,
        created: createdCount,
        updated: updatedCount,
        total_models: APPLE_MODELS_CATALOG.length,
        seed_version: currentVersion
      }
    };
    
    console.log('🎉 Apple models seed completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('💥 Error in Apple models seed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Erro ao processar catálogo Apple'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});