import { useServiceWorkerUpdate } from '@/lib/useServiceWorkerUpdate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

export const UpdatePrompt = () => {
  const { hasUpdate, apply } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUpdate || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    apply();
    // Reload after service worker takes control
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Nova versão disponível</p>
              <p className="text-xs text-muted-foreground">
                Atualize para a versão mais recente
              </p>
            </div>
          </div>
          <div className="flex gap-1">
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
              onClick={() => setDismissed(true)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};