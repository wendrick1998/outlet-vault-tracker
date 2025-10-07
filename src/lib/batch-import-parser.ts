import { matchAppleModel } from "./apple-catalog-utils";

export interface ParsedDevice {
  model: string;
  storage?: string;
  color?: string;
  condition: string;
  battery_pct: number;
  imei: string;
  cost?: number;
  warranty_months?: number;
}

/**
 * Parser inteligente para texto de nota de fornecedor
 * Detecta automaticamente: modelo, IMEI, preço, garantia, condição, bateria
 */
export const parseSupplierText = (
  text: string,
  defaultWarranty: number = 0
): ParsedDevice[] => {
  const lines = text.split("\n").filter((line) => line.trim());
  const devices: ParsedDevice[] = [];
  let currentDevice: Partial<ParsedDevice> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Detectar modelo (primeira linha do bloco)
    if (/iPhone|iPad|Apple\s*Watch|AirPods|MacBook/i.test(trimmed)) {
      // Salvar device anterior se existir IMEI e modelo
      if (currentDevice.imei && currentDevice.model) {
        devices.push(currentDevice as ParsedDevice);
      }

      // Parsear nova linha de modelo usando matchAppleModel
      const match = matchAppleModel(trimmed);
      if (match) {
        currentDevice = {
          model: match.model,
          storage: match.storage ? `${match.storage}GB` : undefined,
          color: match.color,
          condition: detectCondition(trimmed),
          battery_pct: extractBatteryPct(trimmed),
          warranty_months: defaultWarranty,
        };
      }
    }

    // Detectar IMEI (formatos: IMEI 1:, IMEI:, ou apenas número de 15 dígitos)
    const imeiMatch = trimmed.match(/IMEI\s*\d*:\s*(\d{15})/i);
    if (imeiMatch) {
      currentDevice.imei = imeiMatch[1];
    } else {
      // Tentar detectar IMEI sem prefixo
      const bareImeiMatch = trimmed.match(/\b(\d{15})\b/);
      if (bareImeiMatch && !currentDevice.imei) {
        currentDevice.imei = bareImeiMatch[1];
      }
    }

    // Detectar preço/custo (formato: R$ 2.150,00 ou R$2150,00)
    const priceMatch = trimmed.match(/R\$\s*([\d.,]+)/);
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(/\./g, "").replace(",", ".");
      const price = parseFloat(priceStr);
      if (!isNaN(price)) {
        currentDevice.cost = price;
      }
    }

    // Detectar garantia específica (formato: Garantia: 3 meses)
    const warrantyMatch = trimmed.match(/Garantia:\s*(\d+)\s*mes/i);
    if (warrantyMatch) {
      currentDevice.warranty_months = parseInt(warrantyMatch[1]);
    }

    // Detectar quantidade em estoque (apenas para informação, não usado)
    const qtyMatch = trimmed.match(/Qtd:\s*(\d+)/i);
    if (qtyMatch) {
      // Nota: quantidade não é armazenada no device individual
      // mas poderia ser usado para validação
    }
  }

  // Adicionar último device se completo
  if (currentDevice.imei && currentDevice.model) {
    devices.push(currentDevice as ParsedDevice);
  }

  return devices;
};

/**
 * Detecta condição do aparelho baseado em palavras-chave
 */
const detectCondition = (text: string): string => {
  const upperText = text.toUpperCase();

  if (/SEMINOVO|SEMI\s*NOVO/i.test(upperText)) return "usado";
  if (/USADO/i.test(upperText)) return "usado";
  if (/NOVO|LACRADO/i.test(upperText)) return "novo";
  if (/RECONDICIONADO/i.test(upperText)) return "usado";

  // Default para lotes de fornecedor
  return "usado";
};

/**
 * Extrai porcentagem de bateria do texto (formato: (100%))
 */
const extractBatteryPct = (text: string): number => {
  const match = text.match(/\((\d+)%\)/);
  return match ? parseInt(match[1]) : 100;
};

/**
 * Valida se um IMEI tem formato correto (15 dígitos)
 */
export const isValidIMEI = (imei: string): boolean => {
  return /^\d{15}$/.test(imei);
};

/**
 * Sanitiza texto antes do parsing (remove caracteres especiais problemáticos)
 */
export const sanitizeSupplierText = (text: string): string => {
  return text
    .replace(/\r\n/g, "\n") // Normalizar quebras de linha
    .replace(/\t/g, " ") // Substituir tabs por espaços
    .replace(/\s{2,}/g, " "); // Remover espaços múltiplos
};

/**
 * Estatísticas do parsing para feedback ao usuário
 */
export interface ParseStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  totalCost: number;
}

export const calculateParseStats = (
  devices: ParsedDevice[],
  duplicateIMEIs: Set<string>
): ParseStats => {
  const validDevices = devices.filter((d) => isValidIMEI(d.imei));
  const duplicates = devices.filter((d) => duplicateIMEIs.has(d.imei));
  const totalCost = validDevices.reduce((sum, d) => sum + (d.cost || 0), 0);

  return {
    total: devices.length,
    valid: validDevices.length,
    invalid: devices.length - validDevices.length,
    duplicates: duplicates.length,
    totalCost,
  };
};
