import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Phone, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoanInfo {
  id: string;
  status: string;
  issued_at: string;
  due_at?: string;
  customer?: {
    name: string;
    phone?: string;
  };
  seller?: {
    name: string;
  };
  reason?: {
    name: string;
  };
}

interface LoanInfoDisplayProps {
  inventoryId?: string;
  imei: string;
}

export const LoanInfoDisplay = ({ inventoryId, imei }: LoanInfoDisplayProps) => {
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoanInfo = async () => {
      try {
        // Buscar empréstimo ativo para este item
        const { data, error } = await supabase
          .from('loans')
          .select(`
            id,
            status,
            issued_at,
            due_at,
            customer:customers (
              name,
              phone
            ),
            seller:sellers (
              name
            ),
            reason:reasons (
              name
            )
          `)
          .eq('item_id', inventoryId)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        
        setLoanInfo(data);
      } catch (error) {
        console.error('Erro ao buscar informações do empréstimo:', error);
      } finally {
        setLoading(false);
      }
    };

    if (inventoryId) {
      fetchLoanInfo();
    } else {
      setLoading(false);
    }
  }, [inventoryId, imei]);

  if (loading) {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-orange-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-orange-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loanInfo) {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Item marcado como emprestado mas sem empréstimo ativo encontrado
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getDaysUntilDue = () => {
    if (!loanInfo.due_at) return null;
    const dueDate = new Date(loanInfo.due_at);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <Card className="bg-orange-50 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Informações do Empréstimo
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Cliente */}
        {loanInfo.customer && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-orange-600" />
            <div className="text-sm">
              <span className="font-medium text-orange-800">
                {loanInfo.customer.name}
              </span>
              {loanInfo.customer.phone && (
                <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {loanInfo.customer.phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Datas */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-orange-700">
            <Calendar className="h-3 w-3" />
            <span>Emprestado em: {formatDate(loanInfo.issued_at)}</span>
          </div>
          
          {loanInfo.due_at && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-orange-700">
                <ArrowRight className="h-3 w-3" />
                <span>Vence em: {formatDate(loanInfo.due_at)}</span>
              </div>
              
              {daysUntilDue !== null && (
                <Badge 
                  variant={daysUntilDue < 0 ? "destructive" : daysUntilDue <= 2 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {daysUntilDue < 0 
                    ? `${Math.abs(daysUntilDue)} dias em atraso`
                    : daysUntilDue === 0
                    ? 'Vence hoje'
                    : `${daysUntilDue} dias restantes`
                  }
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Motivo */}
        {loanInfo.reason && (
          <div className="text-xs text-orange-700">
            <span className="font-medium">Motivo:</span> {loanInfo.reason.name}
          </div>
        )}

        {/* Vendedor */}
        {loanInfo.seller && (
          <div className="text-xs text-orange-600">
            <span className="font-medium">Responsável:</span> {loanInfo.seller.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
};