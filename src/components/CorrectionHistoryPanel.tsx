import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, User, Calendar, FileText, Shield } from 'lucide-react';
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
}

interface CorrectionHistoryPanelProps {
  loanId: string;
}

export function CorrectionHistoryPanel({ loanId }: CorrectionHistoryPanelProps) {
  const { data: corrections, isLoading } = useQuery({
    queryKey: ['loan-corrections', loanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_corrections')
        .select(`
          *,
          profiles:corrected_by(full_name, email)
        `)
        .eq('loan_id', loanId)
        .order('corrected_at', { ascending: false });

      if (error) throw error;
      return data as LoanCorrection[];
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Correções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!corrections || corrections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Correções</CardTitle>
          <CardDescription>Nenhuma correção registrada para este empréstimo</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Histórico de Correções
          <Badge variant="secondary" className="ml-auto">
            {corrections.length} {corrections.length === 1 ? 'correção' : 'correções'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Registro completo de todas as correções realizadas neste empréstimo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {corrections.map((correction, index) => (
              <div key={correction.id}>
                <div className="space-y-3">
                  {correction.is_critical && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">CORREÇÃO CRÍTICA</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(correction.previous_status)} text-white text-xs`}>
                          {getStatusLabel(correction.previous_status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">→</span>
                        <Badge className={`${getStatusColor(correction.new_status)} text-white text-xs`}>
                          {getStatusLabel(correction.new_status)}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Motivo:</strong>
                        <p className="mt-1">{correction.correction_reason}</p>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{correction.profiles?.full_name || correction.profiles?.email || 'Sistema'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(correction.corrected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {correction.pin_validated && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Shield className="h-3 w-3" />
                            <span>PIN Validado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {index < corrections.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
