import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
}

export const ErrorFallback = ({ 
  error, 
  resetError, 
  title = "Algo deu errado",
  description = "Ocorreu um erro inesperado" 
}: ErrorFallbackProps) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-destructive/10 text-destructive p-3 rounded-full">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
        
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">{description}</p>
        
        {error && (
          <details className="text-left mb-4">
            <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
              Ver detalhes do erro
            </summary>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        
        {resetError && (
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </Card>
    </div>
  );
};