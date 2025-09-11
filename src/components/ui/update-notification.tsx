import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { showUpdateAvailable } from '@/lib/serviceWorker';

interface UpdateNotificationProps {
  registration: ServiceWorkerRegistration;
  onDismiss: () => void;
}

export const UpdateNotification = ({ 
  registration, 
  onDismiss 
}: UpdateNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleUpdate = () => {
    showUpdateAvailable(registration);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed top-4 right-4 z-50 p-4 bg-card border shadow-lg max-w-sm animate-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">
            Nova versão disponível
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Uma atualização do aplicativo está pronta para ser instalada.
          </p>
          
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              onClick={handleUpdate}
              className="h-7 px-2 text-xs"
            >
              Atualizar
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="h-7 px-2 text-xs"
            >
              Mais tarde
            </Button>
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6 p-0 hover:bg-secondary"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>
    </Card>
  );
};