// Utilitários para importação de inventário
export interface ImportedItem {
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

export interface ImportSummary {
  total: number;
  preview_count?: number;
  ready: number;
  review_required: number;
  duplicates: number;
  created?: number;
  updated?: number;
  errors?: number;
}

// Validação IMEI usando algoritmo Luhn
export function validateIMEI(imei: string): boolean {
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

// Mascarar IMEI para logs (mostrar apenas últimos 4 dígitos)
export function maskIMEI(imei: string): string {
  if (imei.length < 4) return '*'.repeat(imei.length);
  return '*'.repeat(imei.length - 4) + imei.slice(-4);
}

// Condições válidas
export const VALID_CONDITIONS = [
  'Novo',
  'Seminovo', 
  'Recondicionado',
  'Grade_A',
  'Grade_B', 
  'Grade_C',
  'Defeituoso'
] as const;

export type ValidCondition = typeof VALID_CONDITIONS[number];

// Cores canônicas Apple
export const APPLE_COLORS = [
  'Preto',
  'Branco',
  'Azul',
  'Vermelho',
  'Dourado',
  'Rosa',
  'Roxo',
  'Verde',
  'Grafite',
  'Estelar',
  'Meia-noite',
  'Roxo-profundo',
  'Titânio preto',
  'Titânio branco',
  'Titânio azul',
  'Titânio natural',
] as const;

// Mapear sinônimos de cores
export function normalizeColor(color: string): string {
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
    'pink': 'Rosa',
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
  
  const normalized = color.toLowerCase().trim();
  return colorMap[normalized] || color;
}

// Gerar batch ID único
export function generateBatchId(): string {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
  return `${date}-${time}-outletplus`;
}

// Determinar status de um item baseado na confiança e validações
export function determineItemStatus(
  item: Partial<ImportedItem>,
  existsInInventory: boolean = false
): ImportedItem['status'] {
  if (existsInInventory) return 'DUPLICATE';
  
  if (!item.brand || !item.model || !item.imei1) {
    return 'REVIEW_REQUIRED';
  }
  
  if (item.imei1 && !validateIMEI(item.imei1)) {
    return 'REVIEW_REQUIRED';
  }
  
  if (item.parse_confidence && item.parse_confidence < 0.70) {
    return 'REVIEW_REQUIRED';
  }
  
  return 'READY';
}

// Formatar resumo para exibição
export function formatImportSummary(summary: ImportSummary): string {
  const parts = [];
  
  if (summary.created) parts.push(`${summary.created} criados`);
  if (summary.updated) parts.push(`${summary.updated} atualizados`);
  if (summary.duplicates) parts.push(`${summary.duplicates} duplicados`);
  if (summary.errors) parts.push(`${summary.errors} erros`);
  
  return parts.join(', ') || 'Nenhuma alteração';
}

// Exportar erros para CSV
export function exportErrorsToCSV(items: ImportedItem[]): string {
  const errorItems = items.filter(item => 
    item.status === 'REVIEW_REQUIRED' || item.status === 'DUPLICATE'
  );
  
  const headers = [
    'Título Original',
    'IMEI',
    'Marca', 
    'Modelo',
    'Status',
    'Confiança',
    'Motivo'
  ];
  
  const rows = errorItems.map(item => [
    item.title_original,
    maskIMEI(item.imei1),
    item.brand,
    item.model, 
    item.status,
    item.parse_confidence.toString(),
    item.status === 'DUPLICATE' ? 'IMEI já existe' : 'Dados insuficientes ou inválidos'
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}