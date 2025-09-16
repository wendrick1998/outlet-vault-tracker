import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Users, UserCheck, Calendar, Zap, TrendingUp } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type Seller = Database['public']['Tables']['sellers']['Row'];

interface SmartFormHelperProps {
  item?: InventoryItem;
  formData?: any;
  onSuggestionApply?: (field: string, value: any) => void;
  context?: string;
}

interface SmartSuggestion {
  id: string;
  name: string;
  reason: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface SmartAction {
  suggestions?: SmartSuggestion[];
  isValid?: boolean;
  confidence?: number;
  risks?: string[];
  recommendations?: string[];
  filledFields?: Record<string, any>;
  suggestedDate?: string;
  reasoning?: string;
  alternatives?: Array<{date: string, reason: string}>;
}

export function SmartFormHelper({ item, formData, onSuggestionApply, context }: SmartFormHelperProps) {
  const [suggestions, setSuggestions] = useState<{
    customers: SmartSuggestion[];
    sellers: SmartSuggestion[];
    returnDate: string | null;
    validation: SmartAction | null;
  }>({
    customers: [],
    sellers: [],
    returnDate: null,
    validation: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoFillFields, setAutoFillFields] = useState<Record<string, any>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const loadSmartSuggestions = async () => {
    if (!item || !user) return;

    setIsLoading(true);
    try {
      // Get customer suggestions
      const customerResponse = await supabase.functions.invoke('ai-smart-actions', {
        body: {
          action: 'suggest_customer',
          context,
          userId: user.id,
          itemData: item,
          formData
        }
      });

      // Get seller suggestions
      const sellerResponse = await supabase.functions.invoke('ai-smart-actions', {
        body: {
          action: 'suggest_seller',
          context,
          userId: user.id,
          itemData: item,
          formData
        }
      });

      // Get auto-fill suggestions
      const autoFillResponse = await supabase.functions.invoke('ai-smart-actions', {
        body: {
          action: 'auto_fill',
          context,
          userId: user.id,
          itemData: item,
          formData
        }
      });

      // Get return date suggestion
      const returnDateResponse = await supabase.functions.invoke('ai-smart-actions', {
        body: {
          action: 'suggest_return_date',
          context,
          userId: user.id,
          itemData: item,
          formData
        }
      });

      if (customerResponse.data?.result?.suggestions) {
        setSuggestions(prev => ({
          ...prev,
          customers: customerResponse.data.result.suggestions
        }));
      }

      if (sellerResponse.data?.result?.suggestions) {
        setSuggestions(prev => ({
          ...prev,
          sellers: sellerResponse.data.result.suggestions
        }));
      }

      if (autoFillResponse.data?.result?.filledFields) {
        setAutoFillFields(autoFillResponse.data.result.filledFields);
      }

      if (returnDateResponse.data?.result?.suggestedDate) {
        setSuggestions(prev => ({
          ...prev,
          returnDate: returnDateResponse.data.result.suggestedDate
        }));
      }

    } catch (error) {
      toast({
        title: "Assistente IA Indisponível",
        description: "As sugestões inteligentes não estão disponíveis no momento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateLoan = async () => {
    if (!item || !user || !formData) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-smart-actions', {
        body: {
          action: 'validate_loan',
          context,
          userId: user.id,
          itemData: item,
          formData
        }
      });

      if (response.data?.result) {
        setSuggestions(prev => ({
          ...prev,
          validation: response.data.result
        }));

        toast({
          title: response.data.result.isValid ? "✅ Empréstimo validado" : "⚠️ Atenção necessária",
          description: `Confiança: ${Math.round(response.data.result.confidence * 100)}%`,
          variant: response.data.result.isValid ? "default" : "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validação IA Indisponível",
        description: "A validação inteligente não está disponível no momento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyAutoFill = () => {
    Object.entries(autoFillFields).forEach(([field, value]) => {
      onSuggestionApply?.(field, value);
    });
    
    toast({
      title: "✨ Preenchimento Automático",
      description: `${Object.keys(autoFillFields).length} campos preenchidos com sugestões da IA`,
    });
  };

  useEffect(() => {
    if (item) {
      loadSmartSuggestions();
    }
  }, [item?.id, JSON.stringify(formData)]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  if (!item) return null;

  return (
    <Card className="mt-4 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Assistente Inteligente</h3>
          <Badge variant="outline" className="text-xs">
            IA
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Auto-fill suggestion */}
          {Object.keys(autoFillFields).length > 0 && (
            <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">
                  {Object.keys(autoFillFields).length} campos podem ser preenchidos automaticamente
                </span>
              </div>
              <Button size="sm" onClick={applyAutoFill} disabled={isLoading}>
                Aplicar
              </Button>
            </div>
          )}

          {/* Customer suggestions */}
          {suggestions.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Clientes recomendados:</span>
              </div>
              <div className="grid gap-2">
                {suggestions.customers.slice(0, 2).map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded border cursor-pointer hover:bg-blue-100"
                    onClick={() => onSuggestionApply?.('customer_id', customer.id)}
                  >
                    <div>
                      <span className="font-medium text-sm">{customer.name}</span>
                      <p className="text-xs text-muted-foreground">{customer.reason}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={getRiskColor(customer.riskLevel)} className="text-xs">
                        {Math.round(customer.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller suggestions */}
          {suggestions.sellers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Vendedores recomendados:</span>
              </div>
              <div className="grid gap-2">
                {suggestions.sellers.slice(0, 2).map((seller) => (
                  <div
                    key={seller.id}
                    className="flex items-center justify-between p-2 bg-green-50 rounded border cursor-pointer hover:bg-green-100"
                    onClick={() => onSuggestionApply?.('seller_id', seller.id)}
                  >
                    <div>
                      <span className="font-medium text-sm">{seller.name}</span>
                      <p className="text-xs text-muted-foreground">{seller.reason}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(seller.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return date suggestion */}
          {suggestions.returnDate && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Data de devolução sugerida:</span>
              </div>
              <div
                className="p-2 bg-purple-50 rounded border cursor-pointer hover:bg-purple-100"
                onClick={() => onSuggestionApply?.('due_at', suggestions.returnDate)}
              >
                <span className="font-medium text-sm">
                  {new Date(suggestions.returnDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          )}

          {/* Validation results */}
          {suggestions.validation && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">Validação do empréstimo:</span>
              </div>
              <div className={`p-3 rounded-lg border ${
                suggestions.validation.isValid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {suggestions.validation.isValid ? '✅ Aprovado' : '⚠️ Revisar'}
                  </span>
                  <Badge variant="outline">
                    {Math.round((suggestions.validation.confidence || 0) * 100)}% confiança
                  </Badge>
                </div>
                
                {suggestions.validation.risks && suggestions.validation.risks.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Riscos identificados:</p>
                    <ul className="text-xs space-y-1">
                      {suggestions.validation.risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-orange-600">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestions.validation.recommendations && suggestions.validation.recommendations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Recomendações:</p>
                    <ul className="text-xs space-y-1">
                      {suggestions.validation.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={loadSmartSuggestions}
              disabled={isLoading}
              className="flex-1"
            >
              🔄 Atualizar sugestões
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={validateLoan}
              disabled={isLoading || !formData}
              className="flex-1"
            >
              ✅ Validar empréstimo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}