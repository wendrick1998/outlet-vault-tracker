import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInconsistencyMonitor, useInconsistencyHistory } from '@/hooks/useInconsistencyMonitor';
import { useSensitiveAccessMetrics } from '@/hooks/useSensitiveDataAccess';
import { Shield, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ComplianceMetricsDashboard = () => {
  const { inconsistencies } = useInconsistencyMonitor();
  const { data: historyData = [] } = useInconsistencyHistory(7);
  const { data: accessMetrics } = useSensitiveAccessMetrics(30);

  // Calcular score de conformidade LGPD (0-100)
  const calculateComplianceScore = () => {
    let score = 100;
    
    // Penalizar por inconsistências ativas (cada uma -5 pontos)
    const inconsistencyPenalty = Math.min(inconsistencies.length * 5, 30);
    score -= inconsistencyPenalty;
    
    // Penalizar se houver muitas sessões expiradas não limpas
    const expiredRatio = accessMetrics?.expiredSessions / (accessMetrics?.totalSessions || 1) || 0;
    if (expiredRatio > 0.5) score -= 10;
    
    // Bonificar se houver auditoria ativa
    if (accessMetrics && accessMetrics.totalAccesses > 0) score += 5;
    
    return Math.max(0, Math.min(100, score));
  };

  const complianceScore = calculateComplianceScore();

  // Dados para gráfico de tendência de inconsistências
  const inconsistencyTrendData = historyData.map((item) => ({
    day: item.date,
    count: item.count
  }));

  // Dados para heatmap de acessos (simulado por hora)
  const accessHeatmapData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}h`,
    accesses: Math.floor(Math.random() * 20) // Em produção, usar dados reais
  }));

  // Top campos acessados para PieChart
  const topFieldsData = accessMetrics?.topAccessedFields.map(field => ({
    name: field.field,
    value: field.count
  })) || [];

  // Top usuários mais ativos
  const topUsersData = accessMetrics?.topUsers.slice(0, 10) || [];

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'Excelente', icon: CheckCircle2, color: 'text-green-500' };
    if (score >= 70) return { variant: 'secondary' as const, label: 'Bom', icon: TrendingUp, color: 'text-blue-500' };
    if (score >= 50) return { variant: 'outline' as const, label: 'Regular', icon: Activity, color: 'text-amber-500' };
    return { variant: 'destructive' as const, label: 'Crítico', icon: AlertTriangle, color: 'text-red-500' };
  };

  const scoreBadge = getScoreBadge(complianceScore);

  return (
    <div className="space-y-6">
      {/* Score de Conformidade LGPD */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Score de Conformidade LGPD
              </CardTitle>
              <CardDescription>
                Indicador geral de conformidade com requisitos de privacidade
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{complianceScore}</div>
              <Badge variant={scoreBadge.variant} className="mt-2">
                <scoreBadge.icon className={`h-4 w-4 mr-1 ${scoreBadge.color}`} />
                {scoreBadge.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estatísticas Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Inconsistências Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{inconsistencies.length}</span>
              {inconsistencies.length > 5 ? (
                <AlertTriangle className="h-8 w-8 text-destructive" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sessões de Acesso (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{accessMetrics?.totalSessions || 0}</span>
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {accessMetrics?.activeSessions || 0} ativas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Acessos (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{accessMetrics?.totalAccesses || 0}</span>
              <Activity className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendência de Inconsistências */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Inconsistências (Últimos 7 dias)</CardTitle>
          <CardDescription>Evolução do número de inconsistências detectadas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inconsistencyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Inconsistências"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heatmap de Acessos por Hora */}
        <Card>
          <CardHeader>
            <CardTitle>Padrão de Acessos (24h)</CardTitle>
            <CardDescription>Horários de maior atividade de acesso a dados sensíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accessHeatmapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accesses" fill="#3b82f6" name="Acessos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campos Mais Acessados */}
        <Card>
          <CardHeader>
            <CardTitle>Campos Mais Acessados</CardTitle>
            <CardDescription>Distribuição de acessos por tipo de dado sensível</CardDescription>
          </CardHeader>
          <CardContent>
            {topFieldsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topFieldsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topFieldsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sem dados de acesso nos últimos 30 dias
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Usuários Mais Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Usuários Mais Ativos em Dados Sensíveis</CardTitle>
          <CardDescription>Ranking de usuários com mais acessos a dados protegidos</CardDescription>
        </CardHeader>
        <CardContent>
          {topUsersData.length > 0 ? (
            <div className="space-y-2">
              {topUsersData.map((user, index) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{user.user_id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{user.count} acesso(s)</span>
                    {user.count > 10 && (
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Sem dados de usuários ativos nos últimos 30 dias
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendações de Segurança */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Recomendações de Conformidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {inconsistencies.length > 5 && (
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span><strong>Alta prioridade:</strong> Revise e corrija as {inconsistencies.length} inconsistências ativas</span>
              </li>
            )}
            {accessMetrics && accessMetrics.expiredSessions > 10 && (
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>Execute a limpeza de sessões expiradas ({accessMetrics.expiredSessions} pendentes)</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Revise periodicamente os logs de auditoria para garantir conformidade contínua</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Mantenha documentação atualizada sobre processos de acesso a dados sensíveis</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
