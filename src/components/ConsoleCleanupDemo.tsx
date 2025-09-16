/**
 * Demonstração da migração de console logs para sistema seguro
 * Este componente serve como exemplo para outras migrações
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { replaceConsole } from '@/lib/safe-console';
import { safeConsole } from '@/lib/safe-console';

const console = replaceConsole('ConsoleCleanupDemo');

interface DemoProps {
  title: string;
  showInProduction?: boolean;
}

export const ConsoleCleanupDemo = ({ title, showInProduction = false }: DemoProps) => {
  const [count, setCount] = useState(0);

  const handleDebugClick = () => {
    // ✅ DEPOIS: Console seguro com componente identificado
    console.debug('Debug button clicked', { count, timestamp: Date.now() });
    
    // ✅ DEPOIS: Log com força (aparece em produção se necessário)
    safeConsole.info('Production-safe info', { count }, { 
      component: 'ConsoleCleanupDemo', 
      force: showInProduction 
    });
    
    setCount(prev => prev + 1);
  };

  const handleErrorTest = () => {
    // ✅ DEPOIS: Error handling estruturado
    console.error('Test error triggered', { 
      count, 
      userAgent: navigator.userAgent,
      url: window.location.href 
    });
  };

  const handleWarningTest = () => {
    // ✅ DEPOIS: Warning com metadata contextual
    console.warn('Warning: count getting high', { 
      count, 
      threshold: 10,
      severity: count > 10 ? 'high' : 'medium' 
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant={count > 10 ? 'destructive' : 'default'}>
            {count} clicks
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Este componente demonstra o uso do sistema de logging seguro.
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <Button onClick={handleDebugClick} variant="outline" size="sm">
            Debug Log (count: {count})
          </Button>
          
          <Button onClick={handleErrorTest} variant="destructive" size="sm">
            Test Error Log
          </Button>
          
          <Button onClick={handleWarningTest} variant="secondary" size="sm">
            Test Warning Log
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Abra o DevTools para ver os logs estruturados.
          Em produção, apenas errors/warnings são exibidos.
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsoleCleanupDemo;