import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppError, ErrorInfo, ErrorType } from '@/types/errors';
import { safeConsole } from '@/lib/safe-console';
import { handleError } from '@/lib/error-handler';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Oops! Algo deu errado</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Nossa equipe foi notificada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

const getErrorType = (error: Error): ErrorType => {
  if (error.message.match(/removeChild|NotFoundError|contains/i)) return 'dom_race';
  if (error.message.match(/network|fetch|CORS/i)) return 'network';
  if (error.message.match(/validation|invalid|required/i)) return 'validation';
  if (error.message.match(/auth|unauthorized|forbidden/i)) return 'auth';
  if (error.message.match(/permission|access denied/i)) return 'permission';
  return 'unknown';
};

const logError = (error: Error, errorInfo: React.ErrorInfo) => {
  const errorType = getErrorType(error);
  
  const logData: ErrorInfo = {
    type: errorType,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  safeConsole.error('ErrorBoundary caught an error:', error, { 
    component: 'ErrorBoundary',
    metadata: { errorInfo, ...logData }
  });
  
  // Enhanced logging based on error type
  switch (errorType) {
    case 'dom_race':
      safeConsole.warn('[DOM_RACE_DETECTED]', { 
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        ...logData
      }, { component: 'ErrorBoundary' });
      break;
    case 'network':
      safeConsole.warn('[NETWORK_ERROR]', { 
        message: error.message,
        ...logData
      }, { component: 'ErrorBoundary' });
      break;
    case 'auth':
      safeConsole.warn('[AUTH_ERROR]', { 
        message: error.message,
        ...logData
      }, { component: 'ErrorBoundary' });
      break;
  }
  
  // Use centralized error handler
  handleError(error, {
    showToast: false, // Don't show toast in error boundary
    source: 'ErrorBoundary',
    metadata: { ...logData, errorInfo }
  });
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: { ...errorInfo, ...logData } });
  }
};

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={logError}
    >
      {children}
    </ReactErrorBoundary>
  );
}