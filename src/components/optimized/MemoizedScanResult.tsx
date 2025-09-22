import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Copy, AlertTriangle } from 'lucide-react';

interface Scan {
  id: string;
  imei?: string;
  serial?: string;
  scan_result: string;
  timestamp: string;
}

interface MemoizedScanResultProps {
  scan: Scan;
}

export const MemoizedScanResult = memo(function MemoizedScanResult({ scan }: MemoizedScanResultProps) {
  const getResultIcon = () => {
    switch (scan.scan_result) {
      case 'found_expected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unexpected_present':
        return <XCircle className="h-4 w-4 text-orange-600" />;
      case 'duplicate':
        return <Copy className="h-4 w-4 text-gray-600" />;
      case 'status_incongruent':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'not_found':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getResultBadge = () => {
    switch (scan.scan_result) {
      case 'found_expected':
        return <Badge variant="default">Encontrado</Badge>;
      case 'unexpected_present':
        return <Badge variant="destructive">Fora do Esperado</Badge>;
      case 'duplicate':
        return <Badge variant="secondary">Duplicado</Badge>;
      case 'status_incongruent':
        return <Badge variant="outline">Incongruente</Badge>;
      case 'not_found':
        return <Badge variant="destructive">Não Encontrado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getBorderColor = () => {
    switch (scan.scan_result) {
      case 'found_expected':
        return 'border-green-200 bg-green-50';
      case 'unexpected_present':
        return 'border-orange-200 bg-orange-50';
      case 'status_incongruent':
        return 'border-yellow-200 bg-yellow-50';
      case 'not_found':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`flex items-center justify-between p-2 rounded border ${getBorderColor()}`}>
      <div className="flex items-center gap-2">
        {getResultIcon()}
        <div>
          <div className="font-mono text-sm">{scan.imei || scan.serial}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(scan.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
      {getResultBadge()}
    </div>
  );
});