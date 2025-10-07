import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CameraScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

export function CameraScanner({ onScan, isActive, onToggle }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initScanner = async () => {
      if (!isActive) return;

      setIsInitializing(true);
      setError(null);

      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            console.log('[CameraScanner] Code detected:', decodedText);
            onScan(decodedText);
          },
          (errorMessage) => {
            // Suppress verbose scanning errors
            if (!errorMessage.includes('NotFoundException')) {
              console.warn('[CameraScanner] Scan error:', errorMessage);
            }
          }
        );

        console.log('[CameraScanner] Scanner started');
      } catch (err: any) {
        console.error('[CameraScanner] Failed to start:', err);
        setError(
          err.message?.includes('NotAllowedError')
            ? 'Permissão de câmera negada. Por favor, permita o acesso à câmera.'
            : 'Erro ao iniciar scanner de câmera. Verifique se a câmera está disponível.'
        );
      } finally {
        setIsInitializing(false);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
          scannerRef.current = null;
          console.log('[CameraScanner] Scanner stopped');
        } catch (err) {
          console.error('[CameraScanner] Error stopping scanner:', err);
        }
      }
    };

    if (isActive) {
      initScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, onScan]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Scanner de Câmera</h3>
            <Button
              variant={isActive ? 'destructive' : 'default'}
              onClick={onToggle}
              disabled={isInitializing}
            >
              {isActive ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Desligar Câmera
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Ligar Câmera
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isActive && (
            <div className="relative">
              <div
                id="qr-reader"
                className="rounded-lg overflow-hidden border-2 border-primary"
              />
              <div className="mt-2 text-sm text-muted-foreground text-center">
                Posicione o código de barras ou QR code dentro do quadrado
              </div>
            </div>
          )}

          {!isActive && !error && (
            <div className="text-center py-8 text-muted-foreground">
              Clique em "Ligar Câmera" para começar a escanear
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
