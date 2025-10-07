import { useState } from "react";
import { Plus, Search, Filter, Upload, Archive, Trash2, RotateCcw } from "lucide-react";
import { CSVXLSXImportDialog } from "@/components/CSVXLSXImportDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDevicesAdmin } from "@/hooks/useDevicesAdmin";
import { Loading } from "@/components/ui/loading";
import { AddDeviceDialog } from "@/components/AddDeviceDialog";
import { UnifiedDeviceDialog } from "@/components/UnifiedDeviceDialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BatteryIndicator } from "@/components/BatteryIndicator";
import { DeviceActions } from "@/components/DeviceActions";

export const AdminDevicesTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'delete' | 'restore';
    item: any;
  }>({ isOpen: false, type: 'archive', item: null });

  const { devices: items, isLoading, archiveDevice, deleteDevice, isDeleting } = useDevicesAdmin(showArchived);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === "all" || item.brand === brandFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCondition = conditionFilter === "all" || item.condition === conditionFilter;
    const matchesArchived = showArchived ? true : !item.is_archived;
    
    return matchesSearch && matchesBrand && matchesStatus && matchesCondition && matchesArchived;
  });

  const uniqueBrands = [...new Set(items.map(item => item.brand).filter(Boolean))];

  const handleConfirmAction = async () => {
    if (!confirmModal.item) return;

    try {
      switch (confirmModal.type) {
        case 'archive':
          archiveDevice({ id: confirmModal.item.id, archived: true });
          toast({
            title: "Aparelho arquivado",
            description: "O aparelho foi movido para arquivados com sucesso.",
          });
          break;
          
        case 'restore':
          archiveDevice({ id: confirmModal.item.id, archived: false });
          toast({
            title: "Aparelho restaurado",
            description: "O aparelho foi restaurado com sucesso.",
          });
          break;
          
        case 'delete':
          // Check if device has links
          const { data } = await supabase.rpc('check_device_links', { 
            device_id: confirmModal.item.id 
          });
          
          if (data) {
            toast({
              title: "Não é possível excluir",
              description: "Este aparelho possui vínculos em empréstimos e não pode ser excluído definitivamente.",
              variant: "destructive",
            });
            return;
          }
          
          await deleteDevice(confirmModal.item.id);
          toast({
            title: "Aparelho excluído",
            description: "O aparelho foi excluído definitivamente.",
          });
          break;
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setConfirmModal({ isOpen: false, type: 'archive', item: null });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Aparelhos (Inventário)</h2>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Importar CSV/XLSX
            </Button>
            <UnifiedDeviceDialog onDeviceAdded={() => window.location.reload()} />
            <AddDeviceDialog onDeviceAdded={() => window.location.reload()} />
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por IMEI, marca ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="loaned">Emprestado</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
              <SelectItem value="damaged">Danificado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as condições" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as condições</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="seminovo">Seminovo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch 
              id="show-archived" 
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <label htmlFor="show-archived" className="text-sm font-medium">
              Mostrar arquivados
            </label>
          </div>

          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              setSearchTerm("");
              setBrandFilter("all");
              setStatusFilter("all");
              setConditionFilter("all");
              setShowArchived(false);
            }}
          >
            <Filter className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IMEI</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Memória</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Bateria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>Sinc.</span>
                    <span className="text-xs text-muted-foreground" title="Integração com Stock">ℹ️</span>
                  </div>
                </TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum aparelho encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      ...{item.imei.slice(-5)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.brand} {item.model}
                    </TableCell>
                    <TableCell>{item.color || '-'}</TableCell>
                    <TableCell>{item.storage || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.condition || 'novo'}</Badge>
                    </TableCell>
                    <TableCell>
                      <BatteryIndicator battery={item.battery_pct} />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={item.status === 'available' ? 'default' : 
                               item.status === 'loaned' ? 'secondary' : 'destructive'}
                      >
                        {item.status === 'available' ? 'Disponível' :
                         item.status === 'loaned' ? 'Emprestado' : 
                         item.status === 'sold' ? 'Vendido' : item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.stock_item_id ? (
                          <Badge variant="default" className="text-xs">
                            ✓ Vinculado
                          </Badge>
                        ) : (
                          <>
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Não vinculado
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={async () => {
                                try {
                                  const { data, error } = await supabase.rpc('migrate_inventory_to_stock');
                                  if (error) throw error;
                                  toast({
                                    title: "Sincronização iniciada",
                                    description: "Aguarde alguns segundos e atualize a página.",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Erro na sincronização",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              🔗 Sync
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeviceActions item={item} onAction={setConfirmModal} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Import Dialog */}
        <CSVXLSXImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportComplete={(summary) => {
            // Atualizar dados após importação
            window.location.reload();
            toast({
              title: "Importação concluída",
              description: `${summary.created || 0} itens importados com sucesso`,
            });
          }}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: 'archive', item: null })}
          onConfirm={handleConfirmAction}
          title={
            confirmModal.type === 'archive' ? "Arquivar Aparelho" :
            confirmModal.type === 'restore' ? "Restaurar Aparelho" :
            "Excluir Definitivamente"
          }
          description={
            confirmModal.type === 'archive' 
              ? "Tem certeza que deseja arquivar este aparelho? Ele será movido para a seção de arquivados."
              : confirmModal.type === 'restore'
              ? "Tem certeza que deseja restaurar este aparelho?"
              : "ATENÇÃO: Esta ação é irreversível! O aparelho será excluído permanentemente do sistema."
          }
          variant={confirmModal.type === 'delete' ? 'destructive' : 'default'}
          confirmText={
            confirmModal.type === 'archive' ? "Arquivar" :
            confirmModal.type === 'restore' ? "Restaurar" :
            "Excluir Definitivamente"
          }
        />
      </div>
    </Card>
  );
};