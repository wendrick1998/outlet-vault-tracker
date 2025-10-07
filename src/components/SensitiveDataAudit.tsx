import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Trash2,
  User,
  Calendar
} from 'lucide-react';
import {
  useSensitiveDataSessions,
  useSensitiveAccessHistory,
  useSensitiveAccessMetrics,
  useCleanupExpiredSessions
} from '@/hooks/useSensitiveDataAccess';
import { SensitiveDataService } from '@/services/sensitiveDataService';
import { useAuth } from '@/hooks/useAuth';

export function SensitiveDataAudit() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeRange));

  const {
    data: sessions = [],
    isLoading: loadingSessions,
    refetch: refetchSessions
  } = useSensitiveDataSessions({
    userId: filterUserId || undefined,
    isActive: filterStatus === 'active' ? true : filterStatus === 'expired' ? false : undefined,
    startDate: startDate.toISOString()
  });

  const {
    data: history = [],
    isLoading: loadingHistory
  } = useSensitiveAccessHistory({
    userId: filterUserId || undefined,
    startDate: startDate.toISOString()
  });

  const { data: metrics } = useSensitiveAccessMetrics(parseInt(timeRange));

  const cleanupMutation = useCleanupExpiredSessions();

  const isAdmin = user?.user_metadata?.role === 'admin';

  const handleExportCSV = () => {
    const csv = SensitiveDataService.exportToCSV(sessions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sensitive-data-access-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (session: any) => {
    const isActive = session.is_active && new Date(session.expires_at) > new Date();
    
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Ativa
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Expirada
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Auditoria de Dados Sensíveis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitoramento e auditoria de acessos a dados pessoais
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchSessions()}
                disabled={loadingSessions}
              >
                <RefreshCw className={`h-4 w-4 ${loadingSessions ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={sessions.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar Expiradas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métricas */}
      {metrics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total de Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Últimos {timeRange} dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sessões Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.activeSessions}</div>
              <p className="text-xs text-muted-foreground">Em uso no momento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total de Acessos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAccesses}</div>
              <p className="text-xs text-muted-foreground">Logs de auditoria</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Taxa de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalSessions > 0
                  ? Math.round((metrics.activeSessions / metrics.totalSessions) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Sessões ativas/total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campos mais acessados */}
      {metrics && metrics.topAccessedFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campos Mais Acessados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topAccessedFields.map((item) => (
                <div key={item.field} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.field}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count} acessos</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(item.count / metrics.topAccessedFields[0].count) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Último dia</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário (ID)</label>
              <Input
                placeholder="ID do usuário..."
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de sessões */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões de Acesso ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSessions ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Nenhuma sessão encontrada para os filtros selecionados
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session)}
                        <span className="text-sm text-muted-foreground">
                          Cliente: {session.customer_id.substring(0, 8)}...
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium">{session.access_reason}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {session.approved_fields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {session.user_id.substring(0, 8)}...
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.created_at).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expira: {new Date(session.expires_at).toLocaleTimeString('pt-BR')}
                    </div>
                    <div>
                      {session.used_at ? (
                        <span>Usado: {new Date(session.used_at).toLocaleTimeString('pt-BR')}</span>
                      ) : (
                        <span className="text-yellow-600">Não usado</span>
                      )}
                    </div>
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
