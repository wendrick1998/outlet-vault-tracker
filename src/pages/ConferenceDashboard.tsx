import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveAudits } from "@/hooks/useInventoryAudit";
import { Plus, ClipboardList, Calendar, MapPin, TrendingUp } from "lucide-react";
import { useState } from "react";
import { InventoryConferenceWizard } from "@/components/InventoryConferenceWizard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ConferenceDashboard() {
  const navigate = useNavigate();
  const { data: activeAudits, isLoading } = useActiveAudits();
  const [showWizard, setShowWizard] = useState(false);

  const handleStartConference = (auditId: string) => {
    navigate(`/conference/${auditId}`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      in_progress: { label: "Em Andamento", variant: "default" as const },
      completed: { label: "Concluída", variant: "secondary" as const },
      paused: { label: "Pausada", variant: "outline" as const },
    };
    const config = variants[status as keyof typeof variants] || variants.in_progress;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Conferência</h1>
          <p className="text-muted-foreground">Gerencie conferências de estoque em tempo real</p>
        </div>
        <Button onClick={() => setShowWizard(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Nova Conferência
        </Button>
      </div>

      {/* Active Conferences */}
      {activeAudits && activeAudits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Conferências Ativas
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeAudits.map((audit: any) => {
              const progress = audit.snapshot_count > 0 
                ? Math.round((audit.found_count / audit.snapshot_count) * 100) 
                : 0;

              return (
                <Card key={audit.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {audit.location || "Sem localização"}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Iniciada {formatDistanceToNow(new Date(audit.started_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(audit.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{audit.found_count}</div>
                        <div className="text-xs text-muted-foreground">Encontrados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{audit.missing_count}</div>
                        <div className="text-xs text-muted-foreground">Faltantes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{audit.snapshot_count}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleStartConference(audit.id)}
                      className="w-full"
                    >
                      Continuar Conferência
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Scanner em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Escaneie itens via câmera ou teclado com feedback instantâneo e validação automática.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Classificação Automática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Itens são classificados automaticamente como encontrados, faltantes, duplicados ou incongruentes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Validação de Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sistema verifica se itens escaneados estão na localização esperada e alerta sobre divergências.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wizard */}
      <InventoryConferenceWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSuccess={handleStartConference}
      />
    </div>
  );
}
