import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Download, Search, Filter, Calendar, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoanCorrection {
  id: string;
  loan_id: string;
  previous_status: string;
  new_status: string;
  correction_reason: string;
  is_critical: boolean;
  pin_validated: boolean;
  corrected_at: string;
  corrected_by: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  loans?: {
    inventory?: {
      imei: string;
      brand: string;
      model: string;
    };
  };
}

export function CorrectionsDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCritical, setFilterCritical] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: corrections, isLoading } = useQuery({
    queryKey: ['all-loan-corrections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_corrections')
        .select(`
          *,
          profiles:corrected_by(full_name, email),
          loans(
            inventory(imei, brand, model)
          )
        `)
        .order('corrected_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LoanCorrection[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['correction-stats'],
    queryFn: async () => {
      const [totalRes, criticalRes, todayRes] = await Promise.all([
        supabase.from('loan_corrections').select('id', { count: 'exact', head: true }),
        supabase.from('loan_corrections').select('id', { count: 'exact', head: true }).eq('is_critical', true),
        supabase.from('loan_corrections')
          .select('id', { count: 'exact', head: true })
          .gte('corrected_at', new Date().toISOString().split('T')[0]),
      ]);

      return {
        total: totalRes.count || 0,
        critical: criticalRes.count || 0,
        today: todayRes.count || 0,
      };
    },
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Ativo',
      returned: 'Devolvido',
      sold: 'Vendido',
      overdue: 'Atrasado',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-500',
      returned: 'bg-green-500',
      sold: 'bg-purple-500',
      overdue: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const filteredCorrections = corrections?.filter((correction) => {
    const matchesSearch =
      searchTerm === '' ||
      correction.loans?.inventory?.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      correction.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      correction.correction_reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCritical = filterCritical === 'all' || 
      (filterCritical === 'critical' && correction.is_critical) ||
      (filterCritical === 'normal' && !correction.is_critical);

    const matchesStatus = filterStatus === 'all' || 
      correction.new_status === filterStatus;

    return matchesSearch && matchesCritical && matchesStatus;
  });

  const handleExport = () => {
    if (!filteredCorrections) return;

    const csvContent = [
      ['Data', 'Usuário', 'IMEI', 'Status Anterior', 'Novo Status', 'Motivo', 'Crítica', 'PIN'].join(','),
      ...filteredCorrections.map((c) =>
        [
          format(new Date(c.corrected_at), 'dd/MM/yyyy HH:mm'),
          c.profiles?.full_name || c.profiles?.email || 'Sistema',
          c.loans?.inventory?.imei || 'N/A',
          getStatusLabel(c.previous_status),
          getStatusLabel(c.new_status),
          `"${c.correction_reason.replace(/"/g, '""')}"`,
          c.is_critical ? 'Sim' : 'Não',
          c.pin_validated ? 'Sim' : 'Não',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `correcoes-emprestimos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Correções</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Correções Críticas</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats?.critical || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Correções Hoje</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats?.today || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Correções</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as correções de empréstimos do sistema
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por IMEI, usuário ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCritical} onValueChange={setFilterCritical}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Apenas Críticas</SelectItem>
                <SelectItem value="normal">Apenas Normais</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="returned">Devolvido</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !filteredCorrections || filteredCorrections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma correção encontrada</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Mudança</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCorrections.map((correction) => (
                    <TableRow key={correction.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(correction.corrected_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {correction.profiles?.full_name || correction.profiles?.email || 'Sistema'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {correction.loans?.inventory?.imei || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge className={`${getStatusColor(correction.previous_status)} text-white text-xs`}>
                            {getStatusLabel(correction.previous_status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          <Badge className={`${getStatusColor(correction.new_status)} text-white text-xs`}>
                            {getStatusLabel(correction.new_status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {correction.correction_reason}
                      </TableCell>
                      <TableCell className="text-center">
                        {correction.is_critical ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Crítica
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
