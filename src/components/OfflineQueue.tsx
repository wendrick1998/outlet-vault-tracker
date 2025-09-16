import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Upload, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { OfflineQueueAction } from '@/types/api';

export const OfflineQueue: React.FC = () => {
  const [queue, setQueue] = useState<OfflineQueueAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load queued actions from localStorage
    const storedQueue = localStorage.getItem('offline_queue');
    if (storedQueue) {
      try {
        const parsedQueue = JSON.parse(storedQueue).map((item: Record<string, unknown>) => ({
          ...item,
          timestamp: new Date(item.timestamp as string)
        })) as OfflineQueueAction[];
        setQueue(parsedQueue);
      } catch (error) {
        console.error('Error loading offline queue:', error);
      }
    }

    // Process queue when online
    const handleOnline = () => {
      if (queue.length > 0) {
        processQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const addToQueue = (action: Omit<OfflineQueueAction, 'id' | 'timestamp' | 'retries' | 'status'>) => {
    const newAction: OfflineQueueAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retries: 0,
      status: 'pending'
    };

    const updatedQueue = [...queue, newAction];
    setQueue(updatedQueue);
    localStorage.setItem('offline_queue', JSON.stringify(updatedQueue));

    toast({
      title: 'Ação adicionada à fila',
      description: 'A ação será executada quando a conexão for restabelecida.',
    });
  };

  const processQueue = async () => {
    if (!navigator.onLine || isProcessing) return;
    
    setIsProcessing(true);
    const updatedQueue = [...queue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const action = updatedQueue[i];
      
      if (action.status === 'synced') continue;

      try {
        await executeAction(action);
        updatedQueue[i] = { ...action, status: 'synced' };
        
        toast({
          title: 'Ação sincronizada',
          description: `${getActionLabel(action.type)} foi executada com sucesso.`,
        });
      } catch (error) {
        updatedQueue[i] = { 
          ...action, 
          status: 'failed', 
          retries: action.retries + 1 
        };
        
        if (action.retries >= 3) {
          toast({
            title: 'Falha na sincronização',
            description: `${getActionLabel(action.type)} falhou após múltiplas tentativas.`,
            variant: 'destructive',
          });
        }
      }
    }

    setQueue(updatedQueue);
    localStorage.setItem('offline_queue', JSON.stringify(updatedQueue));
    setIsProcessing(false);
  };

  const executeAction = async (action: OfflineQueueAction): Promise<void> => {
    // Simulate API call - in real implementation, this would call the actual API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.8) {
          reject(new Error('Simulated API error'));
        } else {
          resolve();
        }
      }, 1000);
    });
  };

  const removeAction = (actionId: string) => {
    const updatedQueue = queue.filter(action => action.id !== actionId);
    setQueue(updatedQueue);
    localStorage.setItem('offline_queue', JSON.stringify(updatedQueue));
  };

  const clearSyncedActions = () => {
    const updatedQueue = queue.filter(action => action.status !== 'synced');
    setQueue(updatedQueue);
    localStorage.setItem('offline_queue', JSON.stringify(updatedQueue));
  };

  const getActionLabel = (type: OfflineQueueAction['type']): string => {
    switch (type) {
      case 'create_loan': return 'Criar empréstimo';
      case 'update_loan': return 'Atualizar empréstimo';
      case 'create_item': return 'Criar item';
      case 'update_item': return 'Atualizar item';
      default: return 'Ação';
    }
  };

  const getStatusBadge = (status: OfflineQueueAction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Falhou</Badge>;
      case 'synced':
        return <Badge variant="default">Sincronizado</Badge>;
    }
  };

  if (queue.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          <span className="font-medium">Fila de Sincronização</span>
          <Badge variant="outline">{queue.length} ações</Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={processQueue}
            disabled={!navigator.onLine || isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Processar Fila'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearSyncedActions}
          >
            Limpar Sincronizados
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {queue.map((action) => (
          <div key={action.id} className="flex items-center justify-between p-3 bg-muted rounded">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{getActionLabel(action.type)}</span>
                {getStatusBadge(action.status)}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {action.timestamp.toLocaleString()}
                {action.retries > 0 && ` • ${action.retries} tentativas`}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeAction(action.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};