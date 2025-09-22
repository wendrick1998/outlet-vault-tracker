import { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class LazyErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy loading error:', error, errorInfo);
    
    // Se for erro de chunk loading, tenta recarregar
    if (error.message.includes('Loading chunk') || error.message.includes('dynamically imported module')) {
      this.handleChunkLoadError();
    }
  }

  private handleChunkLoadError = () => {
    if (this.state.retryCount < this.maxRetries) {
      console.log(`Tentando novamente... (${this.state.retryCount + 1}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          retryCount: prevState.retryCount + 1
        }));
      }, 1000 * (this.state.retryCount + 1)); // Backoff progressivo
    }
  };

  private handleManualRetry = () => {
    // Limpa cache e recarrega
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Erro ao Carregar
            </h2>
            <p className="text-muted-foreground mb-6">
              Houve um problema ao carregar esta página. Isso pode ser devido a uma atualização do sistema.
            </p>
            
            {this.state.retryCount < this.maxRetries ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tentando novamente automaticamente...
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((this.state.retryCount + 1) / this.maxRetries) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button onClick={this.handleManualRetry} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Recarregar Página
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}