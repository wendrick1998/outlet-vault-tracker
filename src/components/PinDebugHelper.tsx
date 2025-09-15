import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PinService } from '@/services/pinService';
import { supabase } from '@/integrations/supabase/client';

interface PinDebugHelperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinDebugHelper: React.FC<PinDebugHelperProps> = ({ isOpen, onClose }) => {
  const [testPin, setTestPin] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const addResult = (test: string, result: any, success: boolean) => {
    setResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      test,
      result: JSON.stringify(result, null, 2),
      success
    }]);
  };

  const testPinFormat = () => {
    const result = PinService.validatePinFormat(testPin);
    addResult('Validação de Formato', result, result.valid);
  };

  const testPinSetup = async () => {
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 PIN Debug: Testando configuração do PIN');
      }
      const result = await PinService.setupPin(testPin);
      addResult('Configuração do PIN', result, result.success);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 PIN Debug Error:', error);
      }
      addResult('Configuração do PIN', { error: error.message }, false);
    } finally {
      setIsLoading(false);
    }
  };

  const testPinValidation = async () => {
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 PIN Debug: Testando validação do PIN');
      }
      const result = await PinService.validatePin(testPin);
      addResult('Validação do PIN', result, result.valid);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 PIN Debug Error:', error);
      }
      addResult('Validação do PIN', { error: error.message }, false);
    } finally {
      setIsLoading(false);
    }
  };

  const testHasPinConfigured = async () => {
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 PIN Debug: Verificando se PIN está configurado');
      }
      const result = await PinService.hasPinConfigured();
      addResult('Verificar PIN Configurado', { hasPinConfigured: result }, true);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 PIN Debug Error:', error);
      }
      addResult('Verificar PIN Configurado', { error: error.message }, false);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectRPC = async () => {
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 PIN Debug: Testando RPC direto');
      }
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        addResult('RPC Direto', { error: 'Usuário não autenticado' }, false);
        return;
      }

      const { data, error } = await supabase.rpc('set_operation_pin', {
        user_id: user.user.id,
        pin: testPin
      });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('🚨 RPC Error:', error);
        }
        addResult('RPC Direto', { 
          error: error.message, 
          details: error.details,
          hint: error.hint,
          code: error.code 
        }, false);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ RPC Success:', data);
        }
        addResult('RPC Direto', data, (data as any)?.success === true);
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 PIN Debug Error:', error);
      }
      addResult('RPC Direto', { error: error.message }, false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            🔧 PIN Debug Helper
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            <Input
              placeholder="Digite um PIN para testar (ex: 1234)"
              value={testPin}
              onChange={(e) => setTestPin(e.target.value)}
              maxLength={4}
            />
            <Button onClick={clearResults} variant="outline">Limpar</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={testPinFormat} disabled={isLoading} variant="outline">
              Testar Formato
            </Button>
            <Button onClick={testPinSetup} disabled={isLoading} variant="default">
              Configurar PIN
            </Button>
            <Button onClick={testPinValidation} disabled={isLoading} variant="secondary">
              Validar PIN
            </Button>
            <Button onClick={testHasPinConfigured} disabled={isLoading} variant="outline">
              Verificar Config
            </Button>
            <Button onClick={testDirectRPC} disabled={isLoading} variant="destructive">
              RPC Direto
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">Resultados dos Testes:</h3>
            {results.length === 0 && (
              <p className="text-muted-foreground">Nenhum teste executado ainda.</p>
            )}
            {results.map((result, index) => (
              <Card key={index} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{result.test}</span>
                  <div className="flex gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "✅ Sucesso" : "❌ Erro"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                  </div>
                </div>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {result.result}
                </pre>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};