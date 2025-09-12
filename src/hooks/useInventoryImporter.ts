import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { matchAppleModel, normalizeStorage, normalizeAppleColor } from '@/lib/apple-catalog-utils';
import { InventoryService } from '@/services/inventoryService';
import type { Database } from '@/integrations/supabase/types';

type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];

export interface CSVImportRow {
  imei?: string;
  modelo?: string;
  model?: string;
  brand?: string;
  marca?: string;
  storage?: string;
  armazenamento?: string;
  capacidade?: string;
  color?: string;
  cor?: string;
  condition?: string;
  condicao?: string;
  estado?: string;
  notes?: string;
  observacoes?: string;
  notas?: string;
  [key: string]: string | undefined;
}

export interface ImportResult {
  success: boolean;
  processed: number;
  created: number;
  errors: number;
  skipped: number;
  details: {
    successful: Array<{
      imei: string;
      model: string;
      matched?: boolean;
      confidence?: number;
    }>;
    errors: Array<{
      row: number;
      imei?: string;
      error: string;
      data: CSVImportRow;
    }>;
    skipped: Array<{
      row: number;
      reason: string;
      data: CSVImportRow;
    }>;
  };
}

interface ImportProgress {
  total: number;
  current: number;
  percentage: number;
  status: 'parsing' | 'importing' | 'complete' | 'error';
  currentItem?: string;
}

export function useInventoryImporter() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      return new Promise((resolve, reject) => {
        setProgress({
          total: 0,
          current: 0,
          percentage: 0,
          status: 'parsing'
        });

        Papa.parse<CSVImportRow>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => {
            // Normalize headers to handle different column names
            const normalized = header.toLowerCase().trim();
            const headerMap: { [key: string]: string } = {
              'imei': 'imei',
              'modelo': 'modelo',
              'model': 'modelo',
              'brand': 'marca',
              'marca': 'marca',
              'storage': 'armazenamento',
              'armazenamento': 'armazenamento',
              'capacidade': 'armazenamento',
              'memory': 'armazenamento',
              'memoria': 'armazenamento',
              'color': 'cor',
              'cor': 'cor',
              'colour': 'cor',
              'condition': 'condicao',
              'condicao': 'condicao',
              'estado': 'condicao',
              'status': 'condicao',
              'notes': 'observacoes',
              'observacoes': 'observacoes',
              'notas': 'observacoes',
              'obs': 'observacoes'
            };
            return headerMap[normalized] || normalized;
          },
          complete: async (results) => {
            const data = results.data as CSVImportRow[];
            const importResult: ImportResult = {
              success: true,
              processed: 0,
              created: 0,
              errors: 0,
              skipped: 0,
              details: {
                successful: [],
                errors: [],
                skipped: []
              }
            };

            setProgress({
              total: data.length,
              current: 0,
              percentage: 0,
              status: 'importing'
            });

            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              const rowNumber = i + 2; // +2 because header is row 1 and array is 0-indexed

              try {
                setProgress(prev => prev ? {
                  ...prev,
                  current: i + 1,
                  percentage: Math.round(((i + 1) / data.length) * 100),
                  currentItem: row.imei || `Linha ${rowNumber}`
                } : null);

                const processedItem = await processCSVRow(row, rowNumber);
                
                if (processedItem.skip) {
                  importResult.skipped++;
                  importResult.details.skipped.push({
                    row: rowNumber,
                    reason: processedItem.skipReason || 'Dados insuficientes',
                    data: row
                  });
                  continue;
                }

                if (processedItem.inventoryData) {
                  await InventoryService.create(processedItem.inventoryData);
                  
                  importResult.created++;
                  importResult.details.successful.push({
                    imei: processedItem.inventoryData.imei,
                    model: processedItem.inventoryData.model,
                    matched: processedItem.appleMatch !== null,
                    confidence: processedItem.appleMatch?.confidence
                  });
                }
              } catch (error) {
                importResult.errors++;
                importResult.details.errors.push({
                  row: rowNumber,
                  imei: row.imei,
                  error: error instanceof Error ? error.message : 'Erro desconhecido',
                  data: row
                });
              }

              importResult.processed++;
            }

            setProgress({
              total: data.length,
              current: data.length,
              percentage: 100,
              status: 'complete'
            });

            resolve(importResult);
          },
          error: (error) => {
            setProgress({
              total: 0,
              current: 0,
              percentage: 0,
              status: 'error'
            });
            reject(new Error(`Erro ao processar CSV: ${error.message}`));
          }
        });
      });
    },
    onSuccess: (result) => {
      const { created, errors, skipped } = result;
      
      toast({
        title: "Importação concluída",
        description: `${created} itens criados, ${errors} erros, ${skipped} ignorados`,
        variant: created > 0 ? "default" : "destructive"
      });

      // Clear progress after 3 seconds
      setTimeout(() => setProgress(null), 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive"
      });
      setProgress(null);
    },
  });

  const processCSVRow = async (row: CSVImportRow, rowNumber: number) => {
    // Extract basic fields
    const imei = row.imei?.trim();
    
    if (!imei) {
      return { skip: true, skipReason: 'IMEI obrigatório' };
    }

    // Clean IMEI (keep only digits)
    const cleanImei = imei.replace(/\D/g, '');
    if (cleanImei.length < 10) {
      return { skip: true, skipReason: 'IMEI inválido (muito curto)' };
    }

    // Try to extract model info from different columns
    const modelText = row.modelo || row.model || '';
    const brandText = row.marca || row.brand || '';
    const storageText = row.armazenamento || row.storage || row.capacidade || '';
    const colorText = row.cor || row.color || '';
    const conditionText = row.condicao || row.condition || row.estado || 'novo';
    const notes = row.observacoes || row.notes || row.notas || '';

    let finalBrand = brandText;
    let finalModel = modelText;
    let finalStorage = storageText;
    let finalColor = colorText;
    let appleMatch = null;

    // Try Apple matching if we have model info
    if (modelText) {
      const fullText = `${brandText} ${modelText} ${storageText} ${colorText}`.trim();
      appleMatch = matchAppleModel(fullText);
      
      if (appleMatch && appleMatch.confidence > 0.7) {
        finalBrand = appleMatch.brand;
        finalModel = appleMatch.model;
        if (appleMatch.storage) {
          finalStorage = `${appleMatch.storage}GB`;
        }
        if (appleMatch.color) {
          finalColor = appleMatch.color;
        }
      }
    }

    // Fallback: if no brand detected and modelText contains "iPhone", set Apple
    if (!finalBrand && modelText.toLowerCase().includes('iphone')) {
      finalBrand = 'Apple';
    }

    // Normalize storage if we have storage text
    if (storageText && !finalStorage.includes('GB')) {
      const normalizedStorage = normalizeStorage(storageText);
      if (normalizedStorage) {
        finalStorage = `${normalizedStorage}GB`;
      }
    }

    // Normalize color if it looks like an Apple color
    if (finalBrand === 'Apple' && colorText) {
      const normalizedColor = normalizeAppleColor(colorText);
      if (normalizedColor !== colorText) {
        finalColor = normalizedColor;
      }
    }

    // Validate condition
    const validConditions = ['novo', 'seminovo', 'usado'];
    const normalizedCondition = conditionText.toLowerCase().trim();
    const condition = validConditions.includes(normalizedCondition) ? normalizedCondition : 'novo';

    // Ensure we have minimum required data
    if (!finalBrand || !finalModel) {
      return { skip: true, skipReason: 'Marca e modelo são obrigatórios' };
    }

    const inventoryData: InventoryInsert = {
      imei: cleanImei,
      brand: finalBrand,
      model: finalModel,
      storage: finalStorage || null,
      color: finalColor || null,
      condition: condition as 'novo' | 'seminovo' | 'usado',
      notes: notes || null,
      status: 'available'
    };

    return {
      inventoryData,
      appleMatch,
      skip: false
    };
  };

  const resetProgress = () => setProgress(null);

  return {
    importFromCSV: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    progress,
    resetProgress,
    error: importMutation.error
  };
}
