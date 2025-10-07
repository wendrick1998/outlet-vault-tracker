import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link2, Database, CheckCircle2, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface IntegrationStats {
  total_inventory: number;
  synced_items: number;
  unsynced_items: number;
  sync_rate: number;
  last_check: string;
}

export const IntegrationDashboard = () => {
  const [isMigrating, setIsMigrating] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['integration-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_integration_stats');
      if (error) throw error;
      return data as unknown as IntegrationStats;
    },
  });

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const { data, error } = await supabase.rpc('migrate_inventory_to_stock');
      
      if (error) throw error;

      const result = data as any;
      
      toast({
        title: "✅ Migração Concluída",
        description: result.message || `${result.migrated_count} itens sincronizados com sucesso`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro na migração",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const syncRate = stats?.sync_rate || 0;
  const isFullySynced = syncRate === 100;

  return (
    <div className="space-y-4">
      {/* Alert de atenção se houver itens não sincronizados */}
      {stats && stats.unsynced_items > 0 && (
        <Alert variant="default" className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            <strong>Atenção:</strong> Existem {stats.unsynced_items} itens não sincronizados. 
            Execute a sincronização abaixo para integrar completamente o sistema.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Status da Integração Inventory ↔ Stock
          </CardTitle>
          <CardDescription>
            Sincronização automática entre sistemas de empréstimo e venda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de Sincronização</span>
            <Badge variant={isFullySynced ? "default" : "secondary"}>
              {syncRate.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={syncRate} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.total_inventory || 0}</p>
              <p className="text-xs text-muted-foreground">Total no Inventário</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{stats?.synced_items || 0}</p>
              <p className="text-xs text-muted-foreground">Sincronizados</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats?.unsynced_items || 0}</p>
              <p className="text-xs text-muted-foreground">Não Sincronizados</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {stats && stats.unsynced_items > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <p className="font-medium">Sincronizar Itens Existentes</p>
              <p className="text-sm text-muted-foreground">
                Vincular {stats.unsynced_items} itens do inventário ao sistema de estoque
              </p>
            </div>
            <Button 
              onClick={handleMigration} 
              disabled={isMigrating}
              className="gap-2"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Sincronizar Agora
                </>
              )}
            </Button>
          </div>
        )}

        {isFullySynced && (
          <div className="flex items-center gap-2 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              ✅ Todos os itens estão sincronizados!
            </p>
          </div>
        )}

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Última verificação: {stats?.last_check ? new Date(stats.last_check).toLocaleString('pt-BR') : 'N/A'}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};