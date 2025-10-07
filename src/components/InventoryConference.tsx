import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInventoryAudit } from '@/hooks/useInventoryAudit';
import { useRealtimeAudit } from '@/hooks/useRealtimeAudit';
import { InventoryAuditService } from '@/services/inventoryAuditService';
import { InventoryService } from '@/services/inventoryService';
import { ScanFeedback } from './ScanFeedback';
import { TaskManagement } from './TaskManagement';
import { AuditResetDialog } from './AuditResetDialog';
import { CameraScanner } from './CameraScanner';
import { getOfflineScanQueue } from '@/lib/OfflineScanQueue';
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
  RotateCcw,
  ClipboardList,
  Wifi,
  WifiOff,
  Camera
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
  
  // Enable realtime sync
  useRealtimeAudit(auditId);
  
  const [scanInput, setScanInput] = useState('');
  const [snapshot, setSnapshot] = useState<any[]>([]);
  const [processedItems, setProcessedItems] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [showTaskManagement, setShowTaskManagement] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [searchCache, setSearchCache] = useState<Map<string, any[]>>(new Map());
  const [progressBackup, setProgressBackup] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [cameraMode, setCameraMode] = useState(false);
  
  // Novos estados para filtros visuais
  const [filter, setFilter] = useState<'all' | 'found' | 'missing' | 'inconsistent'>('all');
  
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'scanning' | 'success' | 'warning' | 'error';
    message: string;
    details: string;
    item?: any;
  } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada. Sincronizando...');
      syncOfflineScans();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Modo offline ativado. Scans serão salvos localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending scans on mount
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    const queue = getOfflineScanQueue();
    const count = await queue.getPendingCount();
    setPendingSync(count);
  };

  const syncOfflineScans = async () => {
    const queue = getOfflineScanQueue();
    const result = await queue.sync(async (data) => {
      return new Promise<void>((resolve, reject) => {
        addScan(data, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
    });
    
    if (result.total > 0) {
      toast.success(`Sincronizados ${result.success} scans offline`);
      updatePendingCount();
    }
  };

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

  const playSound = useCallback((type: 'success' | 'error' | 'warning' | 'duplicate') => {
    if (!soundEnabled) return;
    
    const frequencies = {
      success: 800,
      error: 300,
      warning: 600,
      duplicate: 400
    };
    
    try {
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
    } catch (error) {
      console.warn('Audio feedback not available:', error);
    }
  }, [soundEnabled]);

  const handleScan = useCallback(async (code: string) => {
    const now = Date.now();
    if (now - lastScanTime < 300) return; // Improved debounce 300ms
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
      // Use cache for faster searches
      const searchKey = cleanedData.imei || cleanedData.serial!;
      let inventoryItems = searchCache.get(searchKey);
      
      if (!inventoryItems) {
        inventoryItems = await InventoryService.searchByCode(searchKey);
        setSearchCache(prev => new Map(prev).set(searchKey, inventoryItems));
      }

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

      // Add scan to database with location validation
      const locationFound = matchedItem?.location || audit?.location_expected;
      addScan({
        audit_id: auditId,
        raw_code: code,
        imei: cleanedData.imei,
        serial: cleanedData.serial,
        item_id: matchedItem?.id,
        scan_result: scanResult as any,
        location_found: locationFound
      });

      // Check location mismatch
      if (audit?.location_expected && matchedItem?.location && 
          matchedItem.location !== audit.location_expected) {
        toast.warning(`Item em local diferente: ${matchedItem.location} (esperado: ${audit.location_expected})`);
      }

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
      
      // Auto-backup progress every 10 scans
      if (scans.length % 10 === 0) {
        setProgressBackup({
          auditId,
          scansCount: scans.length,
          timestamp: now,
          stats: {
            found: scans.filter(s => s.scan_result === 'found_expected').length,
            unexpected: scans.filter(s => s.scan_result === 'unexpected_present').length,
            duplicates: scans.filter(s => s.scan_result === 'duplicate').length,
            incongruent: scans.filter(s => s.scan_result === 'status_incongruent').length
          }
        });
      }
    }
  }, [auditId, addScan, lastScanTime, playSound, scans, searchCache]);

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

  const resetScans = useCallback(() => {
    setShowResetDialog(true);
  }, []);

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

  // Memoized stats calculation for performance
  const stats = useMemo(() => ({
    total: snapshot.length,
    scanned: scans.length,
    found: scans.filter(s => s.scan_result === 'found_expected').length,
    unexpected: scans.filter(s => s.scan_result === 'unexpected_present').length,
    duplicates: scans.filter(s => s.scan_result === 'duplicate').length,
    incongruent: scans.filter(s => s.scan_result === 'status_incongruent').length,
    missing: snapshot.length - scans.filter(s => s.scan_result === 'found_expected').length
  }), [snapshot.length, scans]);

  const progress = useMemo(() => 
    stats.total > 0 ? (stats.found / stats.total) * 100 : 0, 
    [stats.found, stats.total]
  );

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
              {!isOnline && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline {pendingSync > 0 && `(${pendingSync})`}
                </Badge>
              )}
              {isOnline && pendingSync > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Sincronizando... ({pendingSync})
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCameraMode(!cameraMode)}
              >
                <Camera className="h-4 w-4" />
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
                disabled={isScanning || isResetting}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTaskManagement(!showTaskManagement)}
              >
                <ClipboardList className="h-4 w-4" />
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

      {/* Filtros Visuais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos ({scans.length})
            </Button>
            <Button
              variant={filter === 'found' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('found')}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              Encontrados ({stats.found})
            </Button>
            <Button
              variant={filter === 'inconsistent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('inconsistent')}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              Inconsistentes ({stats.unexpected + stats.incongruent})
            </Button>
            <Button
              variant={filter === 'missing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('missing')}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Faltantes ({stats.missing})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Scanner */}
      {cameraMode && (
        <CameraScanner
          onScan={handleScan}
          isActive={isActive && cameraMode}
          onToggle={() => setCameraMode(!cameraMode)}
        />
      )}

      {/* Scanner Input */}
      {!cameraMode && (
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
      )}

      {/* Scan Feedback */}
      {scanFeedback && (
        <ScanFeedback feedback={scanFeedback} isScanning={isScanning} />
      )}

      {/* Recent Scans com filtros aplicados */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'Últimos Escaneamentos' :
             filter === 'found' ? 'Itens Encontrados' :
             filter === 'inconsistent' ? 'Itens Inconsistentes' :
             'Itens Faltantes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(() => {
              let filteredScans = scans;
              
              if (filter === 'found') {
                filteredScans = scans.filter(s => s.scan_result === 'found_expected');
              } else if (filter === 'inconsistent') {
                filteredScans = scans.filter(s => 
                  ['unexpected_present', 'status_incongruent', 'not_found'].includes(s.scan_result)
                );
              } else if (filter === 'missing') {
                // Para missing, mostrar itens do snapshot que não foram encontrados
                const foundItems = scans.filter(s => s.scan_result === 'found_expected').map(s => s.item_id);
                const missingItems = snapshot.filter(item => !foundItems.includes(item.id));
                
                return missingItems.slice(0, 10).map((item) => (
                  <div key={`missing-${item.id}`} className="flex items-center justify-between p-2 rounded border border-red-200 bg-red-50">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <div>
                        <div className="font-mono text-sm">{item.imei}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.brand} {item.model}
                        </div>
                      </div>
                    </div>
                    <Badge variant="destructive">Não Encontrado</Badge>
                  </div>
                ));
              }
              
              return filteredScans.slice(0, 10).map((scan) => (
                <div 
                  key={scan.id} 
                  className={`flex items-center justify-between p-2 rounded border ${
                    scan.scan_result === 'found_expected' ? 'border-green-200 bg-green-50' :
                    scan.scan_result === 'unexpected_present' ? 'border-orange-200 bg-orange-50' :
                    scan.scan_result === 'status_incongruent' ? 'border-yellow-200 bg-yellow-50' :
                    scan.scan_result === 'not_found' ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {scan.scan_result === 'found_expected' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {scan.scan_result === 'unexpected_present' && <XCircle className="h-4 w-4 text-orange-600" />}
                    {scan.scan_result === 'duplicate' && <Copy className="h-4 w-4 text-gray-600" />}
                    {scan.scan_result === 'status_incongruent' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {scan.scan_result === 'not_found' && <XCircle className="h-4 w-4 text-red-600" />}
                    
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
                    scan.scan_result === 'duplicate' ? 'secondary' : 
                    scan.scan_result === 'not_found' ? 'destructive' : 'outline'
                  }>
                    {scan.scan_result === 'found_expected' && 'Encontrado'}
                    {scan.scan_result === 'unexpected_present' && 'Fora do Esperado'}
                    {scan.scan_result === 'duplicate' && 'Duplicado'}
                    {scan.scan_result === 'status_incongruent' && 'Incongruente'}
                    {scan.scan_result === 'not_found' && 'Não Encontrado'}
                  </Badge>
                </div>
              ));
            })()}
            {scans.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhum item escaneado ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Management Modal */}
      {showTaskManagement && (
        <TaskManagement 
          auditId={auditId}
          isOpen={showTaskManagement}
          onClose={() => setShowTaskManagement(false)}
        />
      )}

      {/* Reset Dialog */}
      <AuditResetDialog
        auditId={auditId}
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onReset={() => {
          setShowResetDialog(false);
          // Clear cache and feedback
          setSearchCache(new Map());
          setScanFeedback(null);
          toast.success('Conferência reiniciada');
        }}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {progressBackup && (
          <div className="text-xs text-muted-foreground mr-4">
            Último backup: {new Date(progressBackup.timestamp).toLocaleTimeString()}
          </div>
        )}
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