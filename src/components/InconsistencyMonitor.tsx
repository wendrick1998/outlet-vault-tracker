import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wrench,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useInconsistencyMonitor, useInconsistencyHistory } from '@/hooks/useInconsistencyMonitor';
import { InconsistencyService } from '@/services/inconsistencyService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function InconsistencyMonitor() {
  const { user } = useAuth();
  const { inconsistencies, count, severity, isLoading, refetch } = useInconsistencyMonitor(true);
  const { data: history = [] } = useInconsistencyHistory(7);
  const [correcting, setCorrecting] = useState<string | null>(null);

  const isAdmin = user?.user_metadata?.role === 'admin';

  const getSeverityBadge = () => {
    switch (severity) {
      case 'ok':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Sistema OK
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Atenção ({count})
          </Badge>
        );
      case 'critical':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Crítico ({count})
          </Badge>
        );
    }
  };

  const handleForceCorrection = async (loanId: string, suggestedStatus: string) => {
    if (!isAdmin) {
      toast({
        title: 'Acesso Negado',
        description: 'Apenas administradores podem forçar correções',
        variant: 'destructive',
      });
      return;
    }

    setCorrecting(loanId);
    try {
      await InconsistencyService.forceCorrection(
        loanId,
        suggestedStatus as 'active' | 'returned' | 'sold'
      );
      
      toast({
        title: 'Correção Aplicada',
        description: 'Inconsistência corrigida com sucesso',
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao corrigir:', error);
      toast({
        title: 'Erro na Correção',
        description: 'Não foi possível corrigir automaticamente',
        variant: 'destructive',
      });
    } finally {
      setCorrecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Monitoramento de Inconsistências
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sincronização entre empréstimos e inventário
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getSeverityBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contador e gráfico simples */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inconsistências Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{count}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {count === 0 ? 'Tudo sincronizado!' : `${count} item(ns) com discrepância`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(-5).map((item) => (
                <div key={item.date} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.date}</span>
                  <span className="font-medium">{item.count} sincronizações</span>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de inconsistências */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Inconsistências</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : count === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma inconsistência detectada. Todos os empréstimos estão sincronizados com o inventário.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {inconsistencies.map((item) => (
                <div
                  key={item.loan_id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{item.imei}</span>
                        <Badge variant="outline" className="text-xs">
                          Loan: {item.loan_status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Inv: {item.inventory_status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {item.issue_description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Loan: {new Date(item.loan_updated).toLocaleString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Inv: {new Date(item.inventory_updated).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleForceCorrection(item.loan_id, item.inventory_status)}
                        disabled={correcting === item.loan_id}
                      >
                        <Wrench className="h-3 w-3 mr-1" />
                        {correcting === item.loan_id ? 'Corrigindo...' : 'Corrigir'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
