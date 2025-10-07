import { useState } from 'react';
import { useAuditLogs, useAuditStats } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/integrations/supabase/types';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Shield, 
  Eye, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { RoleGuard } from '@/components/RoleGuard';
import { InconsistencyMonitor } from '@/components/InconsistencyMonitor';
import { SensitiveDataAudit } from '@/components/SensitiveDataAudit';

export const AuditDashboard = () => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState(30);

  const {
    data: auditLogsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useAuditLogs(selectedUser, selectedAction);

  const { data: auditStats } = useAuditStats(dateRange);

  const allLogs = auditLogsPages?.pages.flat() || [];

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'default';
    if (action.includes('created') || action.includes('registered')) return 'secondary';
    if (action.includes('updated') || action.includes('changed')) return 'outline';
    if (action.includes('deleted') || action.includes('revoked')) return 'destructive';
    if (action.includes('failed') || action.includes('blocked')) return 'destructive';
    return 'default';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'login_success': 'Login realizado',
      'login_failed': 'Falha no login',
      'logout': 'Logout',
      'profile_updated': 'Perfil atualizado',
      'password_changed': 'Senha alterada',
      'account_locked': 'Conta bloqueada',
      'account_unlocked': 'Conta desbloqueada',
      'mfa_enabled': 'MFA ativado',
      'mfa_disabled': 'MFA desativado',
      'backup_codes_generated': 'Códigos de backup gerados',
      'backup_code_used': 'Código de backup usado',
      'session_created': 'Sessão criada',
      'session_revoked': 'Sessão revogada',
      'inventory_created': 'Item criado',
      'inventory_updated': 'Item atualizado',
      'loan_created': 'Empréstimo criado',
      'loan_returned': 'Item devolvido'
    };
    return labels[action] || action;
  };

  const formatDetails = (details: any): React.ReactNode => {
    if (!details) return null;
    
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      if (typeof parsed !== 'object' || parsed === null) {
        return <div className="text-xs">{String(details)}</div>;
      }
      
      return Object.entries(parsed).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium">{key}:</span> {String(value)}
        </div>
      ));
    } catch {
      return <div className="text-xs">{String(details)}</div>;
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'auditor']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Auditoria e Logs
          </h2>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList>
            <TabsTrigger value="logs">Logs de Atividade</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="inconsistencies">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Inconsistências
            </TabsTrigger>
            <TabsTrigger value="sensitive">
              <Lock className="h-4 w-4 mr-1" />
              Dados Sensíveis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Eventos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditStats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">Últimos {dateRange} dias</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Logins Realizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auditStats?.byAction['login_success'] || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Falhas de Login</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {auditStats?.byAction['login_failed'] || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Alterações no Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.entries(auditStats?.byAction || {})
                      .filter(([action]) => action.includes('updated') || action.includes('created'))
                      .reduce((sum, [, count]) => sum + count, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {auditStats?.byAction && Object.keys(auditStats.byAction).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações Mais Frequentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(auditStats.byAction)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([action, count]) => (
                        <div key={action} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionColor(action)}>
                              {getActionLabel(action)}
                            </Badge>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ação</label>
                    <Select value={selectedAction} onValueChange={setSelectedAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as ações" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as ações</SelectItem>
                        <SelectItem value="login_success">Login realizado</SelectItem>
                        <SelectItem value="login_failed">Falha no login</SelectItem>
                        <SelectItem value="profile_updated">Perfil atualizado</SelectItem>
                        <SelectItem value="password_changed">Senha alterada</SelectItem>
                        <SelectItem value="inventory_created">Item criado</SelectItem>
                        <SelectItem value="loan_created">Empréstimo criado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usuário</label>
                    <Input
                      placeholder="ID do usuário"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Select 
                      value={dateRange.toString()} 
                      onValueChange={(value) => setDateRange(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Logs */}
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {allLogs.map((log) => {
                  const typedLog = log as AuditLog & {
                    profiles?: { full_name?: string; email?: string }
                  };
                  
                  return (
                    <Card key={typedLog.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getActionColor(typedLog.action)}>
                                {getActionLabel(typedLog.action)}
                              </Badge>
                              
                              <span className="text-sm text-muted-foreground">
                                {new Date(typedLog.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            
                            <div className="text-sm">
                              <div className="font-medium">
                                {typedLog.profiles?.full_name || 
                                 typedLog.profiles?.email || 
                                 'Sistema'}
                              </div>
                              
                              {typedLog.details && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  {formatDetails(typedLog.details)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right text-xs text-muted-foreground">
                            {typedLog.ip_address && <div>IP: {String(typedLog.ip_address)}</div>}
                            {typedLog.table_name && <div>Tabela: {String(typedLog.table_name)}</div>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {hasNextPage && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                    </Button>
                  </div>
                )}
                
                {allLogs.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
                      <p className="text-muted-foreground">
                        Não há registros de auditoria para os filtros selecionados.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inconsistencies">
            <InconsistencyMonitor />
          </TabsContent>

          <TabsContent value="sensitive">
            <SensitiveDataAudit />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
};