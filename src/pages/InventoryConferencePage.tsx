import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryConference } from '@/components/InventoryConference';
import { InventoryConferenceWizard } from '@/components/InventoryConferenceWizard';
import { useActiveAudits, useInventoryAudit } from '@/hooks/useInventoryAudit';
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  ArrowLeft 
} from 'lucide-react';

export function InventoryConferencePage() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);
  const { data: activeAudits } = useActiveAudits();
  const { audit } = useInventoryAudit(auditId);

  const handleStartConference = (newAuditId: string) => {
    navigate(`/conference/${newAuditId}`);
  };

  const handleFinishConference = () => {
    navigate('/conference');
  };

  // If showing specific audit
  if (auditId) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/conference')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          {audit && (
            <div>
              <h1 className="text-2xl font-bold">Conferência em Andamento</h1>
              <p className="text-muted-foreground">
                {audit.location} • Iniciada em {new Date(audit.started_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <InventoryConference
          auditId={auditId}
          onFinish={handleFinishConference}
        />
      </div>
    );
  }

  // Main conference page
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-8 w-8" />
            Conferência de Inventário
          </h1>
          <p className="text-muted-foreground">
            Sistema de conferência física de estoque com scanner em tempo real
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conferência
        </Button>
      </div>

      {/* Active Audits */}
      {activeAudits && activeAudits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Conferências em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{audit.location}</div>
                    <div className="text-sm text-muted-foreground">
                      Iniciada em {new Date(audit.started_at).toLocaleString()}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        {audit.found_count}/{audit.snapshot_count} encontrados
                      </Badge>
                      {audit.unexpected_count > 0 && (
                        <Badge variant="destructive">
                          {audit.unexpected_count} fora do esperado
                        </Badge>
                      )}
                      {audit.duplicate_count > 0 && (
                        <Badge variant="outline">
                          {audit.duplicate_count} duplicados
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/conference/${audit.id}`)}>
                    Continuar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Scanner em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Suporte a USB, Bluetooth e câmera</li>
              <li>• Validação automática de IMEI</li>
              <li>• Feedback visual e sonoro</li>
              <li>• Detecção de duplicatas</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Classificação Automática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Encontrado esperado</li>
              <li>• Fora do esperado</li>
              <li>• Status incongruente</li>
              <li>• Não encontrados</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Relatórios Detalhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Exportação CSV/JSON</li>
              <li>• Tarefas de regularização</li>
              <li>• Histórico de sessões</li>
              <li>• Métricas de performance</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {(!activeAudits || activeAudits.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Como Começar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Inicie uma nova conferência para realizar a contagem física do seu inventário:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Clique em "Nova Conferência" para abrir o assistente</li>
                <li>Selecione o local onde será realizada a conferência</li>
                <li>Configure os filtros (marca, status, categoria)</li>
                <li>Revise o snapshot de itens a serem conferidos</li>
                <li>Inicie a conferência e comece a escanear os códigos</li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> Certifique-se de que seu scanner esteja funcionando 
                  e que todos os itens estejam fisicamente organizados antes de iniciar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wizard Dialog */}
      <InventoryConferenceWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSuccess={handleStartConference}
      />
    </div>
  );
}