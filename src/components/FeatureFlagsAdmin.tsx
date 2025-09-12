import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { useFeatureFlags, FEATURE_FLAGS } from '@/lib/features';
import { useToast } from '@/hooks/use-toast';

const FEATURE_DESCRIPTIONS: Record<keyof typeof FEATURE_FLAGS, { name: string; description: string; phase: string }> = {
  ENHANCED_AUDIT_LOGGING: {
    name: 'Auditoria Avançada',
    description: 'Sistema completo de logs de auditoria com rastreamento detalhado',
    phase: 'F0'
  },
  LEAKED_PASSWORD_PROTECTION: {
    name: 'Proteção contra Senhas Vazadas',
    description: 'Verificação de senhas contra base de dados de vazamentos conhecidos',
    phase: 'F0'
  },
  STREAMING_AI_ANALYTICS: {
    name: 'Analytics IA em Streaming',
    description: 'Análises de IA com resposta progressiva e tempo real',
    phase: 'F0'
  },
  ADVANCED_INVENTORY_SEARCH: {
    name: 'Busca Avançada de Inventário',
    description: 'Filtros avançados e busca por múltiplos critérios',
    phase: 'F1'
  },
  BATCH_OPERATIONS: {
    name: 'Operações em Lote',
    description: 'Permite operações em múltiplos itens simultaneamente',
    phase: 'F1'
  },
  INVENTORY_CATEGORIES: {
    name: 'Categorias de Inventário',
    description: 'Sistema de categorização e organização de itens',
    phase: 'F1'
  },
  GRANULAR_PERMISSIONS: {
    name: 'Permissões Granulares',
    description: 'Controle fino de permissões por funcionalidade',
    phase: 'F2'
  },
  ROLE_BASED_VISIBILITY: {
    name: 'Visibilidade por Função',
    description: 'Interface adapta conforme o papel do usuário',
    phase: 'F2'
  },
  REASON_CATEGORIES: {
    name: 'Categorias de Motivos',
    description: 'Organização hierárquica de motivos de saída',
    phase: 'F3'
  },
  REASON_WORKFLOWS: {
    name: 'Fluxos de Trabalho',
    description: 'Automação baseada nos motivos de saída',
    phase: 'F3'
  },
  SLA_TRACKING: {
    name: 'Rastreamento de SLA',
    description: 'Controle de tempo limite por tipo de movimentação',
    phase: 'F3'
  },
  REAL_TIME_SYNC: {
    name: 'Sincronização em Tempo Real',
    description: 'Updates automáticos entre usuários conectados',
    phase: 'F4'
  },
  OFFLINE_QUEUE: {
    name: 'Fila Offline',
    description: 'Operações funcionam mesmo sem conexão',
    phase: 'F4'
  },
  ADVANCED_REPORTING: {
    name: 'Relatórios Avançados',
    description: 'Dashboard completo com métricas detalhadas',
    phase: 'F4'
  }
};

const PHASE_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'F0': 'default',
  'F1': 'secondary',
  'F2': 'destructive', 
  'F3': 'outline',
  'F4': 'default'
};

export const FeatureFlagsAdmin = () => {
  const { flags, setFlag, reset } = useFeatureFlags();
  const { toast } = useToast();

  const handleReset = () => {
    reset();
    toast({
      title: 'Feature Flags Resetadas',
      description: 'Todas as configurações foram restauradas ao padrão.',
    });
  };

  const groupedFeatures = Object.entries(FEATURE_DESCRIPTIONS).reduce((acc, [key, info]) => {
    if (!acc[info.phase]) acc[info.phase] = [];
    acc[info.phase].push({ key: key as keyof typeof FEATURE_FLAGS, ...info });
    return acc;
  }, {} as Record<string, Array<{ key: keyof typeof FEATURE_FLAGS; name: string; description: string; phase: string }>>);

  return (
    <Card>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Feature Flags</h2>
            <p className="text-sm text-muted-foreground">
              Controle de funcionalidades por fase de implementação
            </p>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {Object.entries(groupedFeatures).map(([phase, features]) => (
          <div key={phase} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Fase {phase}</h3>
              <Badge variant={PHASE_COLORS[phase] || 'default'}>
                {features.filter(f => flags[FEATURE_FLAGS[f.key]]).length}/{features.length} ativas
              </Badge>
            </div>
            
            <div className="space-y-3">
              {features.map((feature) => (
                <div 
                  key={feature.key}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{feature.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {feature.key.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <Switch
                    checked={flags[FEATURE_FLAGS[feature.key]]}
                    onCheckedChange={(checked) => {
                      setFlag(FEATURE_FLAGS[feature.key], checked);
                      toast({
                        title: checked ? 'Feature Ativada' : 'Feature Desativada',
                        description: `${feature.name} foi ${checked ? 'ativada' : 'desativada'}.`,
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};