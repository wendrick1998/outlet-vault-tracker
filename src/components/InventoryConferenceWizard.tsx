import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInventoryAudit } from '@/hooks/useInventoryAudit';
import { InventoryAuditService } from '@/services/inventoryAuditService';
import { useAuth } from '@/contexts/AuthContext';
import { Search, MapPin, Filter, Package } from 'lucide-react';

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (auditId: string) => void;
}

export function InventoryConferenceWizard({ open, onOpenChange, onSuccess }: WizardProps) {
  const { user } = useAuth();
  const { createAudit, isCreating } = useInventoryAudit();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState({
    status: 'available',
    brand: 'all',
    category: 'all'
  });
  const [snapshot, setSnapshot] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const locations = [
    'Loja Centro',
    'Loja Shopping',
    'Depósito Principal',
    'Depósito Secundário',
    'Oficina Técnica'
  ];

  const brands = [
    'Apple',
    'Samsung',
    'Xiaomi',
    'Motorola',
    'LG',
    'Huawei',
    'Sony'
  ];

  const handleNext = () => {
    if (step === 1 && location) {
      setStep(2);
    } else if (step === 2) {
      generateSnapshot();
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const generateSnapshot = async () => {
    setLoading(true);
    try {
      const snapshotData = await InventoryAuditService.createSnapshot(filters);
      setSnapshot(snapshotData);
      setStep(3);
    } catch (error) {
      console.error('Error generating snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!user?.id) return;

    const auditData = {
      location,
      user_id: user.id,
      filters: filters,
      snapshot_count: snapshot.length
    };

    createAudit(auditData, {
      onSuccess: (data) => {
        onSuccess(data.id);
        onOpenChange(false);
        resetWizard();
      }
    });
  };

  const resetWizard = () => {
    setStep(1);
    setLocation('');
    setFilters({
      status: 'available',
      brand: 'all',
      category: 'all'
    });
    setSnapshot([]);
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetWizard();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Nova Conferência de Inventário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`h-2 w-8 rounded ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-8 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-8 rounded ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {/* Step 1: Location */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local da Conferência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">Selecione o local</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o local da conferência" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="custom-location">Ou digite um local personalizado</Label>
                  <Input
                    id="custom-location"
                    value={location.startsWith('Loja') || location.startsWith('Depósito') || location.startsWith('Oficina') ? '' : location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Filial São Paulo"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Filters */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros da Conferência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Marca</Label>
                    <Select value={filters.brand} onValueChange={(value) => setFilters({...filters, brand: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {brands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="smartphone">Smartphone</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="smartwatch">Smartwatch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Apenas itens com status "Disponível" são normalmente incluídos 
                    na conferência física. Itens emprestados ou vendidos não devem estar fisicamente no local.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Snapshot Preview */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Resumo da Conferência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded">
                    <div className="text-2xl font-bold text-primary">{snapshot.length}</div>
                    <div className="text-sm text-muted-foreground">Itens para conferir</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded">
                    <div className="text-2xl font-bold text-secondary">{location}</div>
                    <div className="text-sm text-muted-foreground">Local</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Filtros aplicados:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Status: {filters.status}</Badge>
                    <Badge variant="outline">Marca: {filters.brand}</Badge>
                    <Badge variant="outline">Categoria: {filters.category}</Badge>
                  </div>
                </div>

                {snapshot.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Distribuição por marca:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(
                        snapshot.reduce((acc: any, item) => {
                          acc[item.brand] = (acc[item.brand] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([brand, count]) => (
                        <div key={brand} className="flex justify-between text-sm">
                          <span>{brand}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Importante:</strong> Certifique-se de que todos os itens esperados 
                    estejam fisicamente disponíveis no local antes de iniciar a conferência.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handlePrevious} disabled={loading || isCreating}>
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={loading || isCreating}>
                Cancelar
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext} disabled={!location || loading}>
                  {step === 2 ? (loading ? 'Gerando...' : 'Gerar Snapshot') : 'Próximo'}
                </Button>
              ) : (
                <Button onClick={handleStart} disabled={isCreating || snapshot.length === 0}>
                  {isCreating ? 'Iniciando...' : 'Iniciar Conferência'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}