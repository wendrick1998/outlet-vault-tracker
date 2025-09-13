import { AlertCircle, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AIQuotaStatusProps {
  isRateLimited: boolean;
  retryAfter: number;
  quotaExceeded: boolean;
  onRetry?: () => void;
  className?: string;
}

export const AIQuotaStatus = ({ 
  isRateLimited, 
  retryAfter, 
  quotaExceeded,
  onRetry,
  className = ""
}: AIQuotaStatusProps) => {
  if (!isRateLimited && !quotaExceeded) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  return (
    <Card className={`p-4 border-orange-200 bg-orange-50 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {quotaExceeded ? (
            <AlertCircle className="h-5 w-5 text-orange-600" />
          ) : (
            <Clock className="h-5 w-5 text-orange-600" />
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-orange-900">
              {quotaExceeded ? 'Limite de IA Atingido' : 'Muitas Solicitações'}
            </h4>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              <Zap className="w-3 h-3 mr-1" />
              IA Temporariamente Indisponível
            </Badge>
          </div>
          
          <p className="text-sm text-orange-700">
            {quotaExceeded 
              ? 'O limite de uso da OpenAI foi atingido. O serviço será restabelecido automaticamente.'
              : 'Muitas solicitações foram feitas. Aguarde um momento antes de tentar novamente.'
            }
          </p>
          
          {retryAfter > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-600">Disponível novamente em:</span>
                <span className="font-mono font-medium text-orange-900">
                  {formatTime(retryAfter)}
                </span>
              </div>
              
              <Progress 
                value={Math.max(0, 100 - (retryAfter / 30) * 100)} 
                className="h-2"
              />
            </div>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            {onRetry && !quotaExceeded && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRetry}
                disabled={retryAfter > 0}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {retryAfter > 0 ? `Aguarde ${formatTime(retryAfter)}` : 'Tentar Novamente'}
              </Button>
            )}
            
            <p className="text-xs text-orange-600">
              💡 O sistema continuará funcionando normalmente sem as funcionalidades de IA
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};