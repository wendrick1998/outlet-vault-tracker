import { Calendar, MapPin, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Database } from '@/integrations/supabase/types';

type StockConference = Database['public']['Tables']['stock_conferences']['Row'];

interface StockConferenceCardProps {
  conference: StockConference;
}

const statusConfig = {
  em_andamento: {
    label: 'Em Andamento',
    color: 'bg-blue-500',
    icon: Clock
  },
  concluida: {
    label: 'Concluída',
    color: 'bg-green-500',
    icon: CheckCircle
  },
  cancelada: {
    label: 'Cancelada',
    color: 'bg-red-500',
    icon: AlertCircle
  }
};

const locationConfig = {
  vitrine: 'Vitrine',
  estoque: 'Estoque',
  assistencia: 'Assistência',
  deposito: 'Depósito',
  loja_online: 'Loja Online',
  conserto: 'Conserto'
};

export const StockConferenceCard = ({ conference }: StockConferenceCardProps) => {
  const statusInfo = statusConfig[conference.status as keyof typeof statusConfig] || statusConfig.em_andamento;
  const StatusIcon = statusInfo.icon;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccuracy = () => {
    if (conference.items_expected === 0) return 0;
    return Math.round((conference.items_found / conference.items_expected) * 100);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{conference.title}</CardTitle>
            {conference.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {conference.description}
              </p>
            )}
          </div>
          
          <Badge 
            className={`text-white ${statusInfo.color}`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conference Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Iniciada</p>
              <p className="font-medium">{formatDate(conference.started_at)}</p>
            </div>
          </div>
          
          {conference.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Local</p>
                <p className="font-medium">
                  {locationConfig[conference.location as keyof typeof locationConfig]}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {conference.items_expected}
            </div>
            <div className="text-xs text-muted-foreground">Esperados</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {conference.items_found}
            </div>
            <div className="text-xs text-muted-foreground">Encontrados</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {conference.items_missing}
            </div>
            <div className="text-xs text-muted-foreground">Faltando</div>
          </div>
        </div>

        {/* Accuracy */}
        {conference.items_expected > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Precisão da Conferência</span>
              <span className="font-medium">{getAccuracy()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${getAccuracy()}%` }}
              />
            </div>
          </div>
        )}

        {/* Completion Info */}
        {conference.completed_at && (
          <div className="text-sm text-muted-foreground">
            Concluída em {formatDate(conference.completed_at)}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Ver Detalhes
          </Button>
          
          {conference.status === 'em_andamento' && (
            <Button size="sm" className="flex-1">
              Continuar Conferência
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};