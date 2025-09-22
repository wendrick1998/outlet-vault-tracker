import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useHasPermission } from '@/hooks/usePermissions';
import { usePinProtection } from '@/hooks/usePinProtection';
import { useReasons } from '@/hooks/useReasons';
import { useSellers } from '@/hooks/useSellers';
import { useCustomers } from '@/hooks/useCustomers';
import { useActiveLoans } from '@/hooks/useLoans';
import { useInventory } from '@/hooks/useInventory';

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
}

interface SystemCheck {
  name: string;
  result: DiagnosticResult;
}

export const CoffeSystemDiagnostic = () => {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Hooks
  const { user } = useAuth();
  const { data: hasWithdrawPermission } = useHasPermission('movements.create');
  const { hasPinConfigured, checkPinConfiguration } = usePinProtection();
  const { reasons = [] } = useReasons();
  const { sellers = [] } = useSellers();
  const { customers = [] } = useCustomers();
  const { data: activeLoans = [] } = useActiveLoans();
  const { items: inventory = [] } = useInventory();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: SystemCheck[] = [];

    // 1. Verificar autenticação
    diagnostics.push({
      name: "Autenticação",
      result: user 
        ? { status: 'success', message: `Usuário logado: ${user.email}` }
        : { status: 'error', message: "Usuário não está logado" }
    });

    // 2. Verificar permissões
    diagnostics.push({
      name: "Permissões de Movimentação", 
      result: hasWithdrawPermission
        ? { status: 'success', message: "Permissão para movimentação concedida" }
        : { status: 'error', message: "Sem permissão para movimentação" }
    });

    // 3. Verificar PIN
    await checkPinConfiguration();
    diagnostics.push({
      name: "PIN Operacional",
      result: hasPinConfigured === true
        ? { status: 'success', message: "PIN configurado" }
        : hasPinConfigured === false
        ? { status: 'warning', message: "PIN não configurado", details: "Configure nas configurações do perfil" }
        : { status: 'warning', message: "Status do PIN desconhecido" }
    });

    // 4. Verificar dados básicos
    diagnostics.push({
      name: "Motivos de Saída",
      result: reasons.length > 0
        ? { status: 'success', message: `${reasons.length} motivos disponíveis` }
        : { status: 'error', message: "Nenhum motivo de saída cadastrado" }
    });

    diagnostics.push({
      name: "Vendedores",
      result: sellers.length > 0
        ? { status: 'success', message: `${sellers.length} vendedores cadastrados` }
        : { status: 'error', message: "Nenhum vendedor cadastrado" }
    });

    diagnostics.push({
      name: "Base de Clientes",
      result: customers.length > 0
        ? { status: 'success', message: `${customers.length} clientes na base` }
        : { status: 'warning', message: "Nenhum cliente cadastrado", details: "Você pode criar clientes durante o empréstimo" }
    });

    // 5. Verificar inventário
    const availableItems = inventory.filter(item => item.status === 'available');
    const loanedItems = inventory.filter(item => item.status === 'loaned');
    
    diagnostics.push({
      name: "Inventário",
      result: inventory.length > 0
        ? { 
          status: 'success', 
          message: `${inventory.length} itens no cofre`,
          details: `${availableItems.length} disponíveis, ${loanedItems.length} emprestados`
        }
        : { status: 'error', message: "Nenhum item no inventário" }
    });

    // 6. Verificar empréstimos ativos
    diagnostics.push({
      name: "Empréstimos Ativos",
      result: {
        status: 'info' as const,
        message: `${activeLoans.length} empréstimo(s) ativo(s)`,
        details: activeLoans.length > 0 ? "Alguns itens estão fora do cofre" : "Todos os itens estão no cofre"
      }
    });

    // 7. Verificar inconsistências
    const inconsistencies = [];
    
    // Verificar se há items com status 'loaned' sem empréstimo ativo
    const loanedWithoutLoan = loanedItems.filter(item => 
      !activeLoans.some(loan => loan.item_id === item.id)
    );
    
    if (loanedWithoutLoan.length > 0) {
      inconsistencies.push(`${loanedWithoutLoan.length} item(s) marcado(s) como emprestado sem empréstimo ativo`);
    }

    // Verificar se há empréstimos ativos com items não marcados como 'loaned'
    const loansWithoutLoanedStatus = activeLoans.filter(loan => {
      const item = inventory.find(i => i.id === loan.item_id);
      return item && item.status !== 'loaned';
    });

    if (loansWithoutLoanedStatus.length > 0) {
      inconsistencies.push(`${loansWithoutLoanedStatus.length} empréstimo(s) ativo(s) com item não marcado como emprestado`);
    }

    diagnostics.push({
      name: "Consistência de Dados",
      result: inconsistencies.length === 0
        ? { status: 'success', message: "Dados consistentes" }
        : { 
          status: 'warning', 
          message: `${inconsistencies.length} inconsistência(s) encontrada(s)`,
          details: inconsistencies.join('; ')
        }
    });

    setChecks(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      warning: 'secondary', 
      error: 'destructive',
      info: 'outline'
    } as const;
    
    return variants[status] || 'outline';
  };

  const hasErrors = checks.some(check => check.result.status === 'error');
  const hasWarnings = checks.some(check => check.result.status === 'warning');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🔍 Diagnóstico do Sistema de Cofre</CardTitle>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Verificando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status geral */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {checks.filter(c => c.result.status === 'success').length}
            </div>
            <div className="text-sm text-muted-foreground">OK</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {checks.filter(c => c.result.status === 'warning').length}
            </div>
            <div className="text-sm text-muted-foreground">Atenção</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {checks.filter(c => c.result.status === 'error').length}
            </div>
            <div className="text-sm text-muted-foreground">Problemas</div>
          </div>
        </div>

        {/* Alerta geral */}
        {hasErrors && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Problemas críticos encontrados!</strong> O sistema pode não funcionar corretamente até que sejam resolvidos.
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && !hasErrors && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Alguns pontos precisam de atenção para funcionamento otimizado.
            </AlertDescription>
          </Alert>
        )}

        {!hasErrors && !hasWarnings && checks.length > 0 && (
          <Alert className="border-success">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription>
              <strong>Sistema OK!</strong> Todos os componentes estão funcionando corretamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de verificações */}
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              {getStatusIcon(check.result.status)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{check.name}</span>
                  <Badge variant={getStatusBadge(check.result.status)} className="text-xs">
                    {check.result.status.toUpperCase()}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">
                  {check.result.message}
                </p>
                
                {check.result.details && (
                  <p className="text-xs text-muted-foreground">
                    {check.result.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instruções de uso */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2">💡 Como usar este diagnóstico:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Problemas (vermelho):</strong> Impedem o funcionamento - devem ser corrigidos</li>
            <li>• <strong>Atenção (amarelo):</strong> Funcionamento limitado - recomenda correção</li>
            <li>• <strong>OK (verde):</strong> Funcionando perfeitamente</li>
            <li>• Execute este diagnóstico sempre que houver problemas com saídas/retornos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};