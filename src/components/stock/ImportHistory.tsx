import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Calendar, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportBatch {
  batch_id: string;
  import_date: string;
  total_items: number;
  status_breakdown: {
    available: number;
    loaned: number;
    sold: number;
  };
}

export const ImportHistory = () => {
  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('import_batch_id, created_at, status')
        .not('import_batch_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por batch_id
      const batchMap = new Map<string, ImportBatch>();

      data.forEach(item => {
        const batchId = item.import_batch_id!;
        
        if (!batchMap.has(batchId)) {
          batchMap.set(batchId, {
            batch_id: batchId,
            import_date: item.created_at,
            total_items: 0,
            status_breakdown: {
              available: 0,
              loaned: 0,
              sold: 0
            }
          });
        }

        const batch = batchMap.get(batchId)!;
        batch.total_items++;
        
        if (item.status === 'available') batch.status_breakdown.available++;
        else if (item.status === 'loaned') batch.status_breakdown.loaned++;
        else if (item.status === 'sold') batch.status_breakdown.sold++;
      });

      return Array.from(batchMap.values());
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar histórico de importações
        </AlertDescription>
      </Alert>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Importações
          </CardTitle>
          <CardDescription>Nenhuma importação realizada ainda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Quando você importar aparelhos, o histórico aparecerá aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Importações
            </CardTitle>
            <CardDescription>
              {batches.length} lote{batches.length !== 1 ? 's' : ''} importado{batches.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {batches.reduce((sum, b) => sum + b.total_items, 0)} itens totais
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Disponíveis</TableHead>
                <TableHead className="text-center">Emprestados</TableHead>
                <TableHead className="text-center">Vendidos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.batch_id}>
                  <TableCell className="font-mono text-xs">
                    {batch.batch_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(batch.import_date))}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{batch.total_items}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-green-600">
                      {batch.status_breakdown.available}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-yellow-600">
                      {batch.status_breakdown.loaned}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-blue-600">
                      {batch.status_breakdown.sold}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};