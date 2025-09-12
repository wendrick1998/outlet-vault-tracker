import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface SmartNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  title: string;
  message: string;
  action?: {
    label: string;
    callback: () => void;
  };
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  autoActions?: string[];
}

interface SmartNotificationsProps {
  className?: string;
  showAll?: boolean;
}

export function SmartNotifications({ className, showAll = false }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateSmartNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get predictions and analytics for notifications
      const [predictionsResponse, analyticsResponse] = await Promise.all([
        supabase.functions.invoke('ai-predictions', {
          body: {
            type: 'risk',
            userId: user.id,
            period: '7d'
          }
        }),
        supabase.functions.invoke('ai-analytics', {
          body: {
            type: 'performance',
            period: '1d'
          }
        })
      ]);

      const newNotifications: SmartNotification[] = [];

      // Process predictions for notifications
      if (predictionsResponse.data?.predictions?.predictions) {
        predictionsResponse.data.predictions.predictions.forEach((prediction: any) => {
          if (prediction.probability > 0.7 && prediction.impact === 'high') {
            newNotifications.push({
              id: `pred_${Date.now()}_${Math.random()}`,
              type: prediction.type === 'risk' ? 'warning' : 'info',
              title: '🔮 Previsão Importante',
              message: prediction.prediction,
              priority: 'high',
              timestamp: new Date(),
              action: {
                label: 'Ver Detalhes',
                callback: () => {
                  toast({
                    title: prediction.item || 'Previsão',
                    description: prediction.recommendation,
                  });
                }
              }
            });
          }
        });
      }

      // Add system health notifications
      const systemStats = await supabase.rpc('get_system_stats');
      if (systemStats.data && typeof systemStats.data === 'object') {
        const stats = systemStats.data as any;
        
        // High utilization warning
        if (stats.inventory?.utilizationRate > 85) {
          newNotifications.push({
            id: `util_${Date.now()}`,
            type: 'warning',
            title: '⚠️ Alta Utilização',
            message: `${stats.inventory.utilizationRate}% dos itens estão em uso. Considere aumentar o estoque.`,
            priority: 'high',
            timestamp: new Date(),
            autoActions: ['Revisar inventário', 'Contatar fornecedores']
          });
        }

        // Overdue items alert
        if (stats.loans?.overdue > 0) {
          newNotifications.push({
            id: `overdue_${Date.now()}`,
            type: 'urgent',
            title: '🚨 Itens em Atraso',
            message: `${stats.loans.overdue} empréstimos estão atrasados. Ação necessária.`,
            priority: 'high',
            timestamp: new Date(),
            action: {
              label: 'Ver Empréstimos',
              callback: () => {
                window.location.href = '/active-loans';
              }
            }
          });
        }

        // Low activity notification
        if (stats.loans?.active === 0) {
          newNotifications.push({
            id: `activity_${Date.now()}`,
            type: 'info',
            title: '💤 Baixa Atividade',
            message: 'Nenhum empréstimo ativo. Boa hora para organizar o inventário.',
            priority: 'low',
            timestamp: new Date()
          });
        }
      }

      // Add time-based notifications
      const currentHour = new Date().getHours();
      if (currentHour === 9) {
        newNotifications.push({
          id: `morning_${Date.now()}`,
          type: 'info',
          title: '🌅 Bom dia!',
          message: 'Novo dia de trabalho. Que tal verificar os empréstimos pendentes?',
          priority: 'low',
          timestamp: new Date()
        });
      }

      setNotifications(prev => [...newNotifications, ...prev].slice(0, 20));

    } catch (error) {
      console.error('Error generating smart notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'success': return 'border-green-200 bg-green-50';
      case 'urgent': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium': return <Badge variant="default" className="text-xs">Média</Badge>;
      default: return <Badge variant="secondary" className="text-xs">Baixa</Badge>;
    }
  };

  useEffect(() => {
    generateSmartNotifications();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(generateSmartNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const visibleNotifications = showAll ? notifications : notifications.slice(0, 5);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Notificações Inteligentes</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {notifications.length} nova{notifications.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 border rounded-lg ${getNotificationColor(notification.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    {getPriorityBadge(notification.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Clock className="h-3 w-3" />
                    <span>{notification.timestamp.toLocaleTimeString('pt-BR')}</span>
                  </div>

                  {notification.autoActions && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {notification.autoActions.map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {notification.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={notification.action.callback}
                      className="text-xs"
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissNotification(notification.id)}
                className="h-6 w-6 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {!showAll && notifications.length > 5 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todas as {notifications.length} notificações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}