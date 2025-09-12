import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RealTimeSyncProps {
  onSyncStatusChange?: (isOnline: boolean) => void;
}

export const RealTimeSync: React.FC<RealTimeSyncProps> = ({ onSyncStatusChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onSyncStatusChange?.(true);
      performSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onSyncStatusChange?.(false);
      toast({
        title: 'Conexão perdida',
        description: 'Os dados serão sincronizados quando a conexão for restabelecida.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup Supabase real-time subscriptions
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'loans'
      }, (payload) => {
        console.log('Real-time update:', payload);
        setLastSync(new Date());
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory'
      }, (payload) => {
        console.log('Real-time update:', payload);
        setLastSync(new Date());
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(channel);
    };
  }, [onSyncStatusChange, toast]);

  const performSync = async () => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSync(new Date());
      setSyncStatus('idle');
      
      toast({
        title: 'Sincronização completa',
        description: 'Todos os dados foram sincronizados com sucesso.',
      });
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar todos os dados.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status da Conexão</span>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            
            {lastSync && (
              <p className="text-sm text-muted-foreground">
                Última sincronização: {lastSync.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncStatus === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={performSync}
            disabled={!isOnline || syncStatus === 'syncing'}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>
      </div>
    </Card>
  );
};