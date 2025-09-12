import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedItem {
  brand: string;
  model: string;
  storage_gb: number | null;
  color: string | null;
  condition: string;
  imei1: string;
  imei2: string | null;
  serial: string | null;
  battery_pct: number | null;
  title_original: string;
  parse_confidence: number;
  import_batch_id: string;
  status: 'READY' | 'REVIEW_REQUIRED' | 'DUPLICATE';
  device_model_id: string | null;
}

// Validação IMEI usando algoritmo Luhn
function validateIMEI(imei: string): boolean {
  const cleanIMEI = imei.replace(/\D/g, '');
  if (cleanIMEI.length !== 15) return false;
  
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleanIMEI[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleanIMEI[14]);
}

// Normalização de marca  
function normalizeBrand(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('iphone') || lowerText.includes('apple')) return 'Apple';
  if (lowerText.includes('samsung') || lowerText.includes('galaxy')) return 'Samsung';
  if (lowerText.includes('motorola') || lowerText.includes('moto')) return 'Motorola';
  if (lowerText.includes('xiaomi') || lowerText.includes('redmi')) return 'Xiaomi';
  if (lowerText.includes('huawei') || lowerText.includes('honor')) return 'Huawei';
  if (lowerText.includes('lg')) return 'LG';
  if (lowerText.includes('sony')) return 'Sony';
  if (lowerText.includes('nokia')) return 'Nokia';
  
  return 'Desconhecida';
}

// Normalização de modelo Apple com melhor suporte ao formato OutletPlus
function normalizeAppleModel(text: string): string | null {
  if (!text) return null;
  
  const cleanText = text.toLowerCase().trim();
  
  // Enhanced iPhone patterns for OutletPlus format
  const patterns = [
    /iphone\s*(\d+)\s*pro\s*max/,
    /iphone\s*(\d+)\s*pro/,
    /iphone\s*(\d+)/,
    /iphone\s*se/,
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      if (cleanText.includes('se')) return 'iPhone SE';
      if (cleanText.includes('pro max')) return `iPhone ${match[1]} Pro Max`;
      if (cleanText.includes('pro')) return `iPhone ${match[1]} Pro`;
      return `iPhone ${match[1]}`;
    }
  }
  
  return null;
}

// Normalização de modelo Apple  
function normalizeAppleModel(text: string): string | null {
  if (!text) return null;
  
  const cleanText = text.toLowerCase().trim();
  
  // Enhanced iPhone patterns for OutletPlus format
  const patterns = [
    /iphone\s*(\d+)\s*pro\s*max/,
    /iphone\s*(\d+)\s*pro/,
    /iphone\s*(\d+)/,
    /iphone\s*se/,
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      if (cleanText.includes('se')) return 'iPhone SE';
      if (cleanText.includes('pro max')) return `iPhone ${match[1]} Pro Max`;
      if (cleanText.includes('pro')) return `iPhone ${match[1]} Pro`;
      return `iPhone ${match[1]}`;
    }
  }
  
  return null;
}

// Extração de armazenamento
function extractStorage(text: string): number | null {
  const matches = text.match(/(\d+)\s*(gb|g)\b/gi);
  if (!matches) return null;
  
  const storages = matches.map(match => {
    const num = parseInt(match.replace(/\D/g, ''));
    return num;
  });
  
  return Math.max(...storages);
}

// Normalização de cor Apple
function normalizeAppleColor(text: string): string | null {
  const colorMap: { [key: string]: string } = {
    'preto': 'Preto',
    'black': 'Preto',
    'branco': 'Branco',
    'white': 'Branco',
    'azul': 'Azul',
    'blue': 'Azul',
    'vermelho': 'Vermelho',
    'red': 'Vermelho',
    'dourado': 'Dourado',
    'gold': 'Dourado',
    'rosa': 'Rosa',
    'rose': 'Rosa',
    'roxo': 'Roxo',
    'purple': 'Roxo',
    'verde': 'Verde',
    'green': 'Verde',
    'grafite': 'Grafite',
    'graphite': 'Grafite',
    'estelar': 'Estelar',
    'starlight': 'Estelar',
    'meia-noite': 'Meia-noite',
    'midnight': 'Meia-noite',
    'roxo-profundo': 'Roxo-profundo',
    'deep purple': 'Roxo-profundo',
    'titânio preto': 'Titânio preto',
    'titânio branco': 'Titânio branco',
    'titânio azul': 'Titânio azul',
    'titânio natural': 'Titânio natural',
  };
  
  const lowerText = text.toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerText.includes(key)) return value;
  }
  
  return null;
}

// Normalização de condição com suporte ao formato OutletPlus
function normalizeCondition(text: string): string {
  if (!text) return 'seminovo';
  
  const lowerText = text.toLowerCase();
  
  // OutletPlus specific patterns
  if (lowerText.includes('novo') && !lowerText.includes('semi')) return 'novo';
  if (lowerText.includes('seminovo') || lowerText.includes('semi-novo')) return 'seminovo';
  if (lowerText.includes('usado') || lowerText.includes('used')) return 'usado';
  
  // Default patterns
  if (lowerText.includes('new')) return 'novo';
  if (lowerText.includes('refurb')) return 'seminovo';
  if (lowerText.includes('recondicionado')) return 'seminovo';
  if (lowerText.includes('lacrado')) return 'novo';
  
  return 'seminovo';
}

// Parser principal otimizado para OutletPlus
function parseItem(row: any, batchId: string): ParsedItem {
  const title = (row.Título || row.Produto || row.Descricao || row.Nome || '').toString().trim();
  const imeiRaw = (row['IMEI 1'] || row.IMEI || row.IMEI1 || '').toString();
  const serial = (row.Serial || '').toString().trim() || null;
  const batteryRaw = (row['% Bateria'] || row.Bateria || row.Battery || '').toString();
  
  // Convert IMEI from scientific notation if needed
  const convertedIMEI = convertScientificIMEI(imeiRaw);
  const imei1 = convertedIMEI.replace(/\D/g, '');
  
  let confidence = 0;
  const scores: number[] = [];
  
  // Validar IMEI
  let imeiValid = false;
  if (imei1.length >= 14 && imei1.length <= 16) {
    const cleanIMEI = imei1.slice(0, 15);
    imeiValid = validateIMEI(cleanIMEI);
    scores.push(imeiValid ? 1.0 : 0.3);
  } else {
    scores.push(0.0);
  }
  
  // Extrair marca
  const brand = normalizeBrand(title);
  scores.push(brand !== 'Desconhecida' ? 1.0 : 0.0);
  
  // Extrair modelo
  let model = '';
  if (brand === 'Apple') {
    model = normalizeAppleModel(title) || '';
  } else {
    // Para outras marcas, extrair modelo básico
    const words = title.split(/\s+/).filter(w => w.length > 2);
    model = words.slice(0, 2).join(' ');
  }
  scores.push(model ? 1.0 : 0.0);
  
  // Extrair armazenamento
  const storage_gb = extractStorage(title);
  scores.push(storage_gb ? 1.0 : 0.5);
  
  // Extrair cor
  let color = null;
  if (brand === 'Apple') {
    color = normalizeAppleColor(title);
  } else {
    // Cores genéricas
    const colors = ['preto', 'branco', 'azul', 'vermelho', 'dourado'];
    for (const c of colors) {
      if (title.toLowerCase().includes(c)) {
        color = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }
  }
  scores.push(color ? 1.0 : 0.5);
  
  // Extrair condição
  const condition = normalizeCondition(title);
  scores.push(0.9); // sempre consegue extrair condição
  
  // Bateria
  let battery_pct = null;
  if (batteryRaw) {
    const batteryNum = parseInt(batteryRaw.replace(/\D/g, ''));
    if (batteryNum >= 0 && batteryNum <= 100) {
      battery_pct = batteryNum;
      scores.push(1.0);
    } else {
      scores.push(0.0);
    }
  } else {
    battery_pct = 100; // Default for new items
    scores.push(0.8);
  }
  
  // Calcular confiança média
  confidence = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Determinar status
  let status: ParsedItem['status'] = 'READY';
  if (!brand || !model || !imei1) {
    status = 'REVIEW_REQUIRED';
  } else if (!imeiValid || confidence < 0.70) {
    status = 'REVIEW_REQUIRED';
  }
  
  return {
    brand,
    model,
    storage_gb,
    color,
    condition,
    imei1: imei1.slice(0, 15),
    imei2: null,
    serial,
    battery_pct,
    title_original: title,
    parse_confidence: parseFloat(confidence.toFixed(2)),
    import_batch_id: batchId,
    status,
    device_model_id: null
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    
    if (endpoint === 'preview') {
      // Endpoint para preview dos dados
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('Arquivo não encontrado');
      }
      
      const buffer = await file.arrayBuffer();
      const batchId = `${new Date().toISOString().split('T')[0]}-outletplus`;
      
      let data: any[] = [];
      
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = new TextDecoder('utf-8').decode(buffer);
        const lines = text.split('\n');
        const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/['"]/g, ''));
        
        data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(/[,;]/).map(v => v.trim().replace(/['"]/g, ''));
            const row: any = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });
      } else if (file.name.endsWith('.xlsx')) {
        // Parse XLSX
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error('Formato de arquivo não suportado');
      }
      
      // Processar apenas as primeiras 20 linhas para preview
      const previewData = data.slice(0, 20);
      const parsedItems = previewData.map(row => parseItem(row, batchId));
      
      const summary = {
        total: data.length,
        preview_count: parsedItems.length,
        ready: parsedItems.filter(item => item.status === 'READY').length,
        review_required: parsedItems.filter(item => item.status === 'REVIEW_REQUIRED').length,
        duplicates: 0, // será calculado no commit
      };
      
      return new Response(JSON.stringify({
        success: true,
        items: parsedItems,
        summary,
        batch_id: batchId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } else if (endpoint === 'commit') {
      // Endpoint para commit final
      const body = await req.json();
      const { items, batch_id } = body;
      
      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      let created = 0;
      let errors = 0;
      let duplicates = 0;
      const errorDetails: any[] = [];

      try {
        // Check for duplicates by IMEI first
        const imeis = items.map((item: ParsedItem) => item.imei1).filter(Boolean);
        const { data: existingItems } = await supabase
          .from('inventory')
          .select('imei')
          .in('imei', imeis);

        const existingIMEIs = new Set(existingItems?.map(item => item.imei) || []);

        // Process items for insertion
        const validItems = [];
        
        for (const item of items) {
          if (item.status === 'DUPLICATE' || existingIMEIs.has(item.imei1)) {
            duplicates++;
            continue;
          }

          if (item.status === 'REVIEW_REQUIRED' && !item.imei1) {
            errors++;
            errorDetails.push({ item, error: 'IMEI inválido' });
            continue;
          }

          // Prepare item for database insertion
          const inventoryItem = {
            imei: item.imei1,
            brand: item.brand,
            model: item.model,
            color: item.color || 'Desconhecido',
            storage: item.storage_gb ? `${item.storage_gb}GB` : null,
            condition: item.condition,
            battery_pct: item.battery_pct || 100,
            status: 'available' as const,
            import_batch_id: batch_id,
            import_confidence: item.parse_confidence,
            title_original: item.title_original,
            notes: item.title_original !== item.model ? `Título original: ${item.title_original}` : null
          };

          validItems.push(inventoryItem);
        }

        // Batch insert valid items
        if (validItems.length > 0) {
          const { data: insertedItems, error: insertError } = await supabase
            .from('inventory')
            .insert(validItems)
            .select();

          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }

          created = insertedItems?.length || 0;

          // Log audit event
          await supabase.rpc('log_audit_event', {
            p_action: 'inventory_batch_import',
            p_details: {
              batch_id: batch_id,
              total_items: items.length,
              created: created,
              duplicates: duplicates,
              errors: errors
            }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Importação concluída com sucesso',
          summary: {
            total: items.length,
            created: created,
            updated: 0,
            duplicates: duplicates,
            errors: errors,
            error_details: errorDetails
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ 
          error: 'Erro ao inserir itens no banco de dados',
          details: error.message
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});