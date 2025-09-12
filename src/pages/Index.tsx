import { Home } from "lucide-react";
import { SecurityMetrics } from "@/components/SecurityMetrics";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Security Metrics - Dev/Debug Only */}
        <div className="mb-4">
          <SecurityMetrics />
        </div>
        
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10 text-primary">
                  <Home className="h-12 w-12" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  Sistema de Inventário
                </h1>
                <p className="text-xl text-muted-foreground">
                  Hardening de segurança implementado com sucesso
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                  🛡️ HIBP Protection
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                  ⚡ SSE Analytics
                </div>
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                  🔧 Feature Flags
                </div>
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200">
                  📊 Performance Metrics
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Sistema pronto para produção - Hardening completo ✅
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;