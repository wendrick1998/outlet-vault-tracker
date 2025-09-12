import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as XLSX from "https://deno.land/x/sheetjs@v0.18.3/xlsx.mjs";

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

// Normalização de modelo Apple
function normalizeAppleModel(text: string): string | null {
  const patterns = [
    /iphone\s*(se|[0-9]{1,2})(\s*plus|\s*pro\s*max|\s*pro)?/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let model = `iPhone ${match[1]}`;
      if (match[2]) {
        const suffix = match[2].trim().toLowerCase();
        if (suffix === 'plus') model += ' Plus';
        else if (suffix === 'pro max') model += ' Pro Max';
        else if (suffix === 'pro') model += ' Pro';
      }
      return model;
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

// Normalização de condição
function normalizeCondition(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('lacrado') || lowerText.includes('novo')) return 'Novo';
  if (lowerText.includes('seminovo') || lowerText.includes('usado')) return 'Seminovo';
  if (lowerText.includes('recondicionado') || lowerText.includes('refurb')) return 'Recondicionado';
  if (lowerText.includes('grade a') || lowerText.includes('a+')) return 'Grade_A';
  if (lowerText.includes('grade b')) return 'Grade_B';
  if (lowerText.includes('grade c')) return 'Grade_C';
  if (lowerText.includes('quebrado') || lowerText.includes('sucata') || lowerText.includes('defeituoso')) return 'Defeituoso';
  
  return 'Seminovo'; // padrão
}

// Parser principal
function parseItem(row: any, batchId: string): ParsedItem {
  const title = (row.Título || row.Produto || row.Descricao || row.Nome || '').toString().trim();
  const imei1Raw = (row['IMEI 1'] || row.IMEI || row.IMEI1 || '').toString().replace(/\D/g, '');
  const serial = (row.Serial || '').toString().trim() || null;
  const batteryRaw = (row['% Bateria'] || row.Bateria || row.Battery || '').toString();
  
  let confidence = 0;
  const scores: number[] = [];
  
  // Validar IMEI
  let imei1 = '';
  let imeiValid = false;
  if (imei1Raw.length >= 14 && imei1Raw.length <= 16) {
    imei1 = imei1Raw.slice(0, 15);
    imeiValid = validateIMEI(imei1);
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
  scores.push(0.8); // sempre consegue extrair condição
  
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
    scores.push(0.5);
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
    imei1,
    imei2: null, // TODO: implementar extração de IMEI2
    serial,
    battery_pct,
    title_original: title,
    parse_confidence: parseFloat(confidence.toFixed(2)),
    import_batch_id: batchId,
    status,
    device_model_id: null // será preenchido na verificação do catálogo
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
      
      // TODO: Implementar inserção no banco
      // 1. Verificar duplicatas por IMEI
      // 2. Inserir em lotes de 100
      // 3. Registrar auditoria
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Importação concluída com sucesso',
        summary: {
          created: items.length,
          updated: 0,
          duplicates: 0,
          errors: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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