import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useInventoryAudit } from '@/hooks/useInventoryAudit';
import { InventoryAuditService } from '@/services/inventoryAuditService';
import { Calendar, FileText, Search, TrendingUp, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function HistoricalAuditDashboard() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  React.useEffect(() => {
    loadHistoricalAudits();
  }, []);

  const loadHistoricalAudits = async () => {
    try {
      setLoading(true);
      const data = await InventoryAuditService.getAllAudits();
      setAudits(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de conferências');
    } finally {
      setLoading(false);
    }
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedPeriod === 'all') return matchesSearch;
    
    const auditDate = new Date(audit.started_at);
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        return matchesSearch && (now.getTime() - auditDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return matchesSearch && (now.getTime() - auditDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      case 'quarter':
        return matchesSearch && (now.getTime() - auditDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
      default:
        return matchesSearch;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Concluída</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Em Andamento</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDurationText = (audit: any) => {
    if (!audit.finished_at) return 'Em andamento';
    
    const start = new Date(audit.started_at);
    const end = new Date(audit.finished_at);
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    
    if (duration < 60) return `${duration}min`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}min`;
  };

  const getEfficiencyScore = (audit: any) => {
    if (audit.snapshot_count === 0) return 0;
    const efficiency = ((audit.found_count / audit.snapshot_count) * 100).toFixed(1);
    return parseFloat(efficiency);
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Conferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar por local ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'week', label: '7 dias' },
                { value: 'month', label: '30 dias' },
                { value: 'quarter', label: '90 dias' }
              ].map(period => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredAudits.length}</div>
              <div className="text-sm text-muted-foreground">Total Conferências</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filteredAudits.filter(a => a.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Concluídas</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredAudits.filter(a => a.status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">Em Andamento</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {filteredAudits.reduce((sum, a) => sum + a.found_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Itens Conferidos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit List */}
      <div className="grid gap-4">
        {filteredAudits.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma conferência encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredAudits.map(audit => (
            <Card key={audit.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{audit.location}</h3>
                    <p className="text-sm text-muted-foreground">
                      Iniciada em {new Date(audit.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(audit.status)}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getDurationText(audit)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{audit.snapshot_count}</div>
                    <div className="text-xs text-muted-foreground">Esperados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{audit.found_count}</div>
                    <div className="text-xs text-muted-foreground">Encontrados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{audit.missing_count}</div>
                    <div className="text-xs text-muted-foreground">Ausentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{audit.unexpected_count}</div>
                    <div className="text-xs text-muted-foreground">Inesperados</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getEfficiencyColor(getEfficiencyScore(audit))}`}>
                      {getEfficiencyScore(audit)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Eficiência</div>
                  </div>
                </div>

                {audit.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{audit.notes}</p>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/conference/report/${audit.id}`, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}