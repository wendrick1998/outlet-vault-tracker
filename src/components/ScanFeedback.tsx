import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScanFeedbackData } from '@/types/api';

interface ScanFeedbackProps {
  feedback: ScanFeedbackData | null;
  isScanning: boolean;
}

export function ScanFeedback({ feedback, isScanning }: ScanFeedbackProps) {
  if (!feedback && !isScanning) return null;

  const getIcon = () => {
    if (isScanning || feedback?.type === 'scanning') {
      return <Search className="h-5 w-5 animate-spin" />;
    }
    
    switch (feedback?.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Search className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (feedback?.type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCardClass = () => {
    const baseClass = "transition-all duration-300 animate-in slide-in-from-top-2";
    
    switch (feedback?.type) {
      case 'success':
        return cn(baseClass, "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20");
      case 'warning':
        return cn(baseClass, "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20");
      case 'error':
        return cn(baseClass, "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20");
      default:
        return cn(baseClass, "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20");
    }
  };

  return (
    <Card className={getCardClass()}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-0.5",
            feedback?.type === 'success' && "text-green-600 dark:text-green-400",
            feedback?.type === 'warning' && "text-yellow-600 dark:text-yellow-400",
            feedback?.type === 'error' && "text-red-600 dark:text-red-400",
            (feedback?.type === 'scanning' || isScanning) && "text-blue-600 dark:text-blue-400"
          )}>
            {getIcon()}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {feedback?.message || 'Escaneando...'}
              </h4>
              
              {feedback?.type && (
                <Badge variant={getVariant()}>
                  {feedback.type === 'success' && 'Encontrado'}
                  {feedback.type === 'warning' && 'Atenção'}
                  {feedback.type === 'error' && 'Erro'}
                  {feedback.type === 'scanning' && 'Processando'}
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {feedback?.details || 'Verificando item no sistema...'}
            </p>
            
            {feedback?.item && (
              <div className="mt-2 p-2 rounded-md bg-background/50 border">
                <div className="text-xs space-y-1">
                  <div className="font-medium">
                    {feedback.item.brand} {feedback.item.model}
                  </div>
                   <div className="text-muted-foreground">
                     Status: {feedback.item.status} | 
                     {feedback.item.imei && ` IMEI: ${feedback.item.imei}`}
                     {feedback.item.suffix && ` Serial: ${feedback.item.suffix}`}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}