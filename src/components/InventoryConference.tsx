import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInventoryAudit } from '@/hooks/useInventoryAudit';
import { InventoryAuditService } from '@/services/inventoryAuditService';
import { InventoryService } from '@/services/inventoryService';
import { ScanFeedback } from './ScanFeedback';
import { 
  Search, 
  CheckCircle, 
  XCircle,
  AlertTriangle, 
  Copy,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface ConferenceProps {
  auditId: string;
  onFinish?: () => void;
}

interface ScanResult {
  id: string;
  code: string;
  result: 'found_expected' | 'unexpected_present' | 'duplicate' | 'status_incongruent';
  timestamp: Date;
  item?: any;
}

export function InventoryConference({ auditId, onFinish }: ConferenceProps) {
  const { audit, scans, addScan, finishAudit, isScanning: isMutating } = useInventoryAudit(auditId);
  const [scanInput, setScanInput] = useState('');
  const [snapshot, setSnapshot] = useState<any[]>([]);
  const [processedItems, setProcessedItems] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'scanning' | 'success' | 'warning' | 'error';
    message: string;
    details: string;
    item?: any;
  } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Load snapshot on mount
  useEffect(() => {
    if (audit?.filters) {
      InventoryAuditService.createSnapshot(audit.filters).then(setSnapshot);
    }
  }, [audit]);

  // Auto-focus scan input
  useEffect(() => {
    if (isActive && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [isActive]);

  // Update processed items from scans
  useEffect(() => {
    const processed = new Set<string>();
    scans.forEach(scan => {
      if (scan.item_id) {
        processed.add(scan.item_id);
      }
    });
    setProcessedItems(processed);
  }, [scans]);

  const playSound = (type: 'success' | 'error' | 'warning' | 'duplicate') => {
    if (!soundEnabled) return;
    
    const frequencies = {
      success: 800,
      error: 300,
      warning: 600,
      duplicate: 400
    };
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleScan = async (code: string) => {
    const now = Date.now();
    if (now - lastScanTime < 500) return; // Debounce 500ms
    setLastScanTime(now);

    if (!code.trim()) return;

    const cleanedData = InventoryAuditService.cleanCode(code);
    if (!cleanedData.imei && !cleanedData.serial) {
      toast.error('Código inválido');
      playSound('error');
      return;
    }

    // Check for duplicate
    const isDuplicate = await InventoryAuditService.checkDuplicateScan(
      auditId, 
      cleanedData.imei || cleanedData.serial!
    );

    if (isDuplicate) {
      addScan({
        audit_id: auditId,
        raw_code: code,
        imei: cleanedData.imei,
        serial: cleanedData.serial,
        scan_result: 'duplicate'
      });
      toast.warning('Item já foi escaneado');
      playSound('duplicate');
      return;
    }

    // Show scanning feedback
    setIsScanning(true);
    setScanFeedback({
      type: 'scanning',
      message: 'Verificando item...',
      details: cleanedData.imei ? `IMEI: ${cleanedData.imei}` : `Serial: ${cleanedData.serial}`
    });

    try {
      // Find item in inventory using enhanced search
      const inventoryItems = await InventoryService.searchByCode(
        cleanedData.imei || cleanedData.serial!
      );

      let matchedItem = null;
      if (cleanedData.imei) {
        matchedItem = inventoryItems.find(item => 
          item.imei === cleanedData.imei || item.suffix === cleanedData.imei
        );
      } else if (cleanedData.serial) {
        matchedItem = inventoryItems.find(item => 
          item.suffix === cleanedData.serial || item.imei === cleanedData.serial
        );
      }

    let scanResult: string;
    let soundType: 'success' | 'error' | 'warning' | 'duplicate';

      if (matchedItem) {
        // Check if item was expected in snapshot
        const wasExpected = snapshot.some(item => item.id === matchedItem.id);
        
        if (wasExpected) {
          if (matchedItem.status === 'available') {
            scanResult = 'found_expected';
            soundType = 'success';
            setScanFeedback({
              type: 'success',
              message: 'Item encontrado!',
              details: `${matchedItem.brand} ${matchedItem.model}`,
              item: matchedItem
            });
          } else {
            scanResult = 'status_incongruent';
            soundType = 'warning';
            setScanFeedback({
              type: 'warning',
              message: 'Status incongruente',
              details: `Esperado: Disponível | Atual: ${matchedItem.status}`,
              item: matchedItem
            });
          }
        } else {
          scanResult = 'unexpected_present';
          soundType = 'warning';
          setScanFeedback({
            type: 'warning',
            message: 'Item fora do estoque esperado',
            details: `${matchedItem.brand} ${matchedItem.model}`,
            item: matchedItem
          });
        }
      } else {
        scanResult = 'not_found';
        soundType = 'error';
        setScanFeedback({
          type: 'error',
          message: 'Item não encontrado',
          details: 'Código não localizado no sistema',
          item: null
        });
      }

      // Add scan to database
      addScan({
        audit_id: auditId,
        raw_code: code,
        imei: cleanedData.imei,
        serial: cleanedData.serial,
        item_id: matchedItem?.id,
        scan_result: scanResult as any
      });

      playSound(soundType);
      
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setScanFeedback(null);
      }, 3000);
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanFeedback({
        type: 'error',
        message: 'Erro ao processar scan',
        details: 'Tente novamente',
        item: null
      });
      playSound('error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScanInput(value);

    // Auto-submit on typical barcode/IMEI length
    if (value.length >= 14 && value.length <= 20) {
      setTimeout(() => {
        handleScan(value);
        setScanInput('');
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && scanInput) {
      handleScan(scanInput);
      setScanInput('');
    }
  };

  const toggleActive = () => {
    setIsActive(!isActive);
    if (!isActive && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  };

  const resetScans = () => {
    if (confirm('Tem certeza que deseja reiniciar a conferência?')) {
      // This would require implementing a reset function
      toast.info('Funcionalidade de reset em desenvolvimento');
    }
  };

  const handleFinish = async () => {
    if (!audit || isFinishing) return;

    const missingCount = snapshot.length - scans.filter(s => s.scan_result === 'found_expected').length;
    const hasIssues = scans.some(s => s.scan_result !== 'found_expected') || missingCount > 0;
    
    if (hasIssues) {
      const message = `Foram encontradas ${scans.filter(s => s.scan_result !== 'found_expected').length} divergências e ${missingCount} itens não encontrados. Deseja finalizar mesmo assim?`;
      if (!confirm(message)) return;
    }

    try {
      setIsFinishing(true);
      finishAudit({ 
        id: auditId, 
        notes: hasIssues ? 'Conferência finalizada com discrepâncias identificadas' : 'Conferência finalizada com sucesso'
      });
      
      // Instead of redirecting, call the onFinish callback with report flag
      setTimeout(() => {
        onFinish?.();
      }, 1000);
    } catch (error) {
      console.error('Erro ao finalizar conferência:', error);
      setIsFinishing(false);
    }
  };

  if (!audit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Carregando conferência...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: snapshot.length,
    scanned: scans.length,
    found: scans.filter(s => s.scan_result === 'found_expected').length,
    unexpected: scans.filter(s => s.scan_result === 'unexpected_present').length,
    duplicates: scans.filter(s => s.scan_result === 'duplicate').length,
    incongruent: scans.filter(s => s.scan_result === 'status_incongruent').length,
    missing: snapshot.length - scans.filter(s => s.scan_result === 'found_expected').length
  };

  const progress = stats.total > 0 ? (stats.found / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Conferência de Inventário
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleActive}
                disabled={isScanning || isMutating}
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetScans}
                disabled={isScanning}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Local: {audit.location} • Iniciado em: {new Date(audit.started_at).toLocaleString()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{stats.found}/{stats.total} ({progress.toFixed(1)}%)</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.found}</div>
                <div className="text-xs text-muted-foreground">Encontrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unexpected}</div>
                <div className="text-xs text-muted-foreground">Fora do Esperado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
                <div className="text-xs text-muted-foreground">Não Encontrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.incongruent}</div>
                <div className="text-xs text-muted-foreground">Incongruentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.duplicates}</div>
                <div className="text-xs text-muted-foreground">Duplicados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.scanned}</div>
                <div className="text-xs text-muted-foreground">Total Escaneado</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Scanner</span>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Ativo" : "Pausado"}
              </Badge>
            </div>
            <Input
              ref={scanInputRef}
              value={scanInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isActive ? "Escaneie códigos, IMEI ou números de série..." : "Scanner pausado"}
              disabled={!isActive || isScanning}
              className="text-lg font-mono"
            />
            {isActive && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Suporte para códigos de barras, IMEI e números de série. Mantenha o foco no campo.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan Feedback */}
      {scanFeedback && (
        <ScanFeedback feedback={scanFeedback} isScanning={isScanning} />
      )}

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Escaneamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {scans.slice(0, 10).map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {scan.scan_result === 'found_expected' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {scan.scan_result === 'unexpected_present' && <XCircle className="h-4 w-4 text-orange-600" />}
                  {scan.scan_result === 'duplicate' && <Copy className="h-4 w-4 text-gray-600" />}
                  {scan.scan_result === 'status_incongruent' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  
                  <div>
                    <div className="font-mono text-sm">{scan.imei || scan.serial}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <Badge variant={
                  scan.scan_result === 'found_expected' ? 'default' :
                  scan.scan_result === 'unexpected_present' ? 'destructive' :
                  scan.scan_result === 'duplicate' ? 'secondary' : 'outline'
                }>
                  {scan.scan_result === 'found_expected' && 'Encontrado'}
                  {scan.scan_result === 'unexpected_present' && 'Fora do Esperado'}
                  {scan.scan_result === 'duplicate' && 'Duplicado'}
                  {scan.scan_result === 'status_incongruent' && 'Incongruente'}
                </Badge>
              </div>
            ))}
            {scans.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhum item escaneado ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleFinish}
          disabled={isFinishing}
          size="lg"
        >
          {isFinishing ? 'Finalizando...' : 'Finalizar Conferência'}
        </Button>
      </div>
    </div>
  );
}