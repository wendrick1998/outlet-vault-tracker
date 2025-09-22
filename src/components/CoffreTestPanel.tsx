import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useLoans } from '@/hooks/useLoans';
import { useToast } from '@/hooks/use-toast';
import { CoffeSystemDiagnostic } from './CoffeSystemDiagnostic';

export const CoffreTestPanel = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const { items: inventory } = useInventory();
  const { loans, createLoan, returnLoan } = useLoans();
  const { toast } = useToast();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${result}`]);
  };

  const runBasicTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addTestResult("🚀 Iniciando teste básico do sistema...");

      // Teste 1: Verificar dados básicos
      addTestResult(`📊 Inventário: ${inventory.length} itens`);
      addTestResult(`📊 Empréstimos: ${loans.length} registros`);

      const availableItems = inventory.filter(item => item.status === 'available');
      addTestResult(`✅ Itens disponíveis: ${availableItems.length}`);

      const loanedItems = inventory.filter(item => item.status === 'loaned');  
      addTestResult(`📤 Itens emprestados: ${loanedItems.length}`);

      // Teste 2: Verificar consistência
      const activeLoans = loans.filter(loan => loan.status === 'active');
      addTestResult(`🔄 Empréstimos ativos: ${activeLoans.length}`);

      if (loanedItems.length !== activeLoans.length) {
        addTestResult(`⚠️ INCONSISTÊNCIA: ${loanedItems.length} itens marcados como emprestados, mas ${activeLoans.length} empréstimos ativos`);
      } else {
        addTestResult(`✅ Consistência OK: Empréstimos ativos = Itens emprestados`);
      }

      // Teste 3: Verificar duplicatas
      const itemsWithMultipleLoans = inventory.filter(item => {
        const itemLoans = activeLoans.filter(loan => loan.item_id === item.id);
        return itemLoans.length > 1;
      });

      if (itemsWithMultipleLoans.length > 0) {
        addTestResult(`❌ ERRO: ${itemsWithMultipleLoans.length} item(s) com múltiplos empréstimos ativos!`);
      } else {
        addTestResult(`✅ Sem duplicatas de empréstimo`);
      }

      addTestResult("✅ Teste básico concluído");

    } catch (error: any) {
      addTestResult(`❌ Erro no teste: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Diagnóstico do Sistema */}
      <CoffeSystemDiagnostic />

      {/* Painel de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Painel de Teste do Cofre</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runBasicTest}
              disabled={isRunning}
              className="flex-1"
            >
              <Play className={`h-4 w-4 mr-2 ${isRunning ? 'animate-pulse' : ''}`} />
              {isRunning ? 'Executando...' : 'Executar Teste Básico'}
            </Button>
            
            <Button 
              onClick={clearResults}
              variant="outline"
              disabled={testResults.length === 0}
            >
              Limpar
            </Button>
          </div>

          {/* Resultados dos testes */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="font-medium">Resultados do Teste:</span>
                <Badge variant="outline">{testResults.length} logs</Badge>
              </div>
              
              <Textarea
                value={testResults.join('\n')}
                readOnly
                className="min-h-[200px] font-mono text-sm"
                placeholder="Os resultados dos testes aparecerão aqui..."
              />
            </div>
          )}

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{inventory.length}</div>
              <div className="text-xs text-muted-foreground">Total Itens</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-success">
                {inventory.filter(i => i.status === 'available').length}
              </div>
              <div className="text-xs text-muted-foreground">Disponíveis</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-warning">
                {inventory.filter(i => i.status === 'loaned').length}
              </div>
              <div className="text-xs text-muted-foreground">Emprestados</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground">
                {inventory.filter(i => i.status === 'sold').length}
              </div>
              <div className="text-xs text-muted-foreground">Vendidos</div>
            </div>
          </div>

          {/* Instruções */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Como usar:</strong> Execute o teste básico para verificar a integridade do sistema. 
              Se encontrar problemas, verifique o diagnóstico acima e corrija os pontos em vermelho antes de usar o cofre.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};