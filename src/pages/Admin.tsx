import { useState, useRef, useCallback, useMemo } from "react";
import { Settings, Package, Users, UserCheck, Tag, Plus, Edit, Trash2, Upload, TrendingUp, Rocket } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable, ResponsiveTableHeader, ResponsiveTableBody, ResponsiveTableRow } from "@/components/ui/responsive-table";
import { LoadingSkeleton } from "@/components/ui/loading-system";

// Create table skeleton wrapper for backward compatibility
const TableRowSkeleton = () => <LoadingSkeleton variant="table" rows={3} />;
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/hooks/use-toast";
import { useInventory } from "@/hooks/useInventory";
import { useReasons } from "@/hooks/useReasons";
import { useSellers } from "@/hooks/useSellers";
import { useCustomers } from "@/hooks/useCustomers";
import { 
  type AdminModal, 
  type EditingItem, 
  type ConfirmModalState,
  type ItemFormData,
  type ReasonFormData,
  type SellerFormData,
  type CustomerFormData,
  type InventoryItem,
  type Reason,
  type Seller,
  type Customer
} from "@/types/admin";
import { itemSchema, reasonSchema, sellerSchema, customerSchema } from "@/lib/validation";
import { FeatureFlagsAdmin } from "@/components/FeatureFlagsAdmin";
import { FeatureFlagWrapper } from "@/components/ui/feature-flag";
import { FEATURE_FLAGS } from "@/lib/features";
import { PermissionGuard, SystemFeaturesGuard } from "@/components/PermissionGuard";
import { MemoizedOfflineQueue } from "@/components/optimized/MemoizedComponents";
import { 
  MemoizedAdvancedSearch,
  MemoizedBatchOperations,
  MemoizedInventoryCategories,
  MemoizedRoleManagement,
  MemoizedReasonWorkflowManager,
  MemoizedSmartReporting,
  MemoizedRealTimeSync,
  MemoizedCanaryDeploymentDashboard,
  MemoizedCanaryMetricsCollector,
  MemoizedFeatureFlagsAdmin
} from "@/components/optimized/AdminMemoizedComponents";
import { UIInventory } from "./admin/UIInventory";
import DesignPanel from "./admin/DesignPanel";
import { UIKit } from "./admin/UIKit";

interface AdminProps {
  onBack: () => void;
}

export const Admin = ({ onBack }: AdminProps) => {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"main" | "ui-inventory" | "design-panel" | "ui-kit">("main");
  const { toast } = useToast();
  
  const [activeModal, setActiveModal] = useState<AdminModal>("none");
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    type: "",
    item: null
  });

  const { 
    items = [], 
    isLoading: inventoryLoading, 
    createItem, 
    updateItem, 
    deleteItem 
  } = useInventory();
  
  const { 
    reasons, 
    isLoading: reasonsLoading, 
    createReason, 
    updateReason, 
    deleteReason 
  } = useReasons();
  
  const { 
    sellers, 
    isLoading: sellersLoading, 
    createSeller, 
    updateSeller, 
    deleteSeller 
  } = useSellers();
  
  const { 
    customers, 
    isLoading: customersLoading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer 
  } = useCustomers();

  // Form states
  const [itemForm, setItemForm] = useState({
    imei: "",
    model: "",
    color: "",
    brand: "",
    storage: ""
  });
  
  const [reasonForm, setReasonForm] = useState({
    name: "",
    description: "",
    requires_customer: false,
    requires_seller: false
  });

  const [sellerForm, setSellerForm] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const [guestCustomerEnabled, setGuestCustomerEnabled] = useState(true);

  const openModal = useCallback((type: AdminModal, item?: InventoryItem | Reason | Seller | Customer) => {
    setActiveModal(type);
    
    if (item) {
      setEditingItem({
        id: item.id,
        type,
        data: item
      });
      
      switch (type) {
        case "item":
          const inventoryItem = item as InventoryItem;
          setItemForm({
            imei: inventoryItem.imei,
            model: inventoryItem.model,
            color: inventoryItem.color,
            brand: inventoryItem.brand,
            storage: inventoryItem.storage || ""
          });
          break;
        case "reason":
          const reason = item as Reason;
          setReasonForm({
            name: reason.name,
            description: reason.description || "",
            requires_customer: reason.requires_customer,
            requires_seller: reason.requires_seller
          });
          break;
        case "seller":
          const seller = item as Seller;
          setSellerForm({
            name: seller.name,
            phone: seller.phone || "",
            email: seller.email || ""
          });
          break;
        case "customer":
          const customer = item as Customer;
          setCustomerForm({
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || ""
          });
          break;
      }
    } else {
      setEditingItem(null);
      // Reset forms
      setItemForm({ imei: "", model: "", color: "", brand: "", storage: "" });
      setReasonForm({ name: "", description: "", requires_customer: false, requires_seller: false });
      setSellerForm({ name: "", phone: "", email: "" });
      setCustomerForm({ name: "", phone: "", email: "" });
    }
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal("none");
    setEditingItem(null);
  }, []);

  const handleSave = async () => {
    try {
      if (activeModal === "item") {
        if (editingItem) {
          await updateItem({ id: editingItem.id, data: itemForm });
        } else {
          await createItem(itemForm);
        }
      } else if (activeModal === "reason") {
        if (editingItem) {
          await updateReason({ id: editingItem.id, data: reasonForm });
        } else {
          await createReason(reasonForm);
        }
      } else if (activeModal === "seller") {
        if (editingItem) {
          await updateSeller({ id: editingItem.id, data: sellerForm });
        } else {
          await createSeller(sellerForm);
        }
      } else if (activeModal === "customer") {
        if (editingItem) {
          await updateCustomer({ id: editingItem.id, data: customerForm });
        } else {
          await createCustomer(customerForm);
        }
      }
      
      toast({
        title: editingItem ? "Item atualizado" : "Item adicionado",
        description: editingItem 
          ? "As alterações foram salvas com sucesso" 
          : "Novo item foi adicionado com sucesso"
      });
      
      closeModal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar item",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Administração" 
        showBack={true} 
        onBack={onBack} 
      />
      
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              Itens
            </TabsTrigger>
            <TabsTrigger value="ui-inventory" onClick={() => setActiveTab("ui-inventory")}>
              UI Inventory
            </TabsTrigger>
            <TabsTrigger value="design-panel" onClick={() => setActiveTab("design-panel")}>
              Design Panel
            </TabsTrigger>
            <TabsTrigger value="ui-kit" onClick={() => setActiveTab("ui-kit")}>
              UI Kit
            </TabsTrigger>
            <TabsTrigger value="reasons" className="gap-2">
              <Tag className="h-4 w-4" />
              Motivos
            </TabsTrigger>
            <TabsTrigger value="sellers" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <FeatureFlagWrapper flag={FEATURE_FLAGS.GRANULAR_PERMISSIONS}>
              <TabsTrigger value="roles" className="gap-2">
                <Users className="h-4 w-4" />
                Papéis
              </TabsTrigger>
            </FeatureFlagWrapper>
            <FeatureFlagWrapper flag={FEATURE_FLAGS.ADVANCED_REPORTING}>
              <TabsTrigger value="reports" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Relatórios
              </TabsTrigger>
            </FeatureFlagWrapper>
            <SystemFeaturesGuard>
              <TabsTrigger value="deploy" className="gap-2">
                <Rocket className="h-4 w-4" />
                Deploy
              </TabsTrigger>
            </SystemFeaturesGuard>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
            <SystemFeaturesGuard>
              <TabsTrigger value="features" className="gap-2">
                <Settings className="h-4 w-4" />
                Features
              </TabsTrigger>
            </SystemFeaturesGuard>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items">
            <div className="space-y-6">
              {/* Advanced Search */}
              <MemoizedAdvancedSearch onResults={(results) => console.log('Search results:', results)} />
              
              {/* Batch Operations */}
              <MemoizedBatchOperations items={items} onRefresh={() => window.location.reload()} />
              
              {/* Inventory Categories */}
              <MemoizedInventoryCategories />
              
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Gestão de Itens</h2>
                    <div className="flex gap-3">
                      <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                      />
                      <PermissionGuard permission="inventory.create">
                        <Button variant="outline" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Importar CSV
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="inventory.create">
                        <Button onClick={() => openModal("item")} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Item
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>

                  {inventoryLoading ? (
                    <Loading />
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <Card key={item.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-sm">...{item.imei.slice(-5)}</span>
                              <span className="ml-3 font-medium">{item.brand} {item.model}</span>
                            </div>
                            <Badge variant={
                              item.status === "available" ? "default" : 
                              item.status === "loaned" ? "secondary" : "destructive"
                            }>
                              {item.status === "available" ? "Disponível" : 
                               item.status === "loaned" ? "Emprestado" : "Vendido"}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Reasons Tab */}
          <TabsContent value="reasons">
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Gestão de Motivos</h2>
                    <Button onClick={() => openModal("reason")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Motivo
                    </Button>
                  </div>

                  {reasonsLoading ? (
                    <Loading />
                  ) : (
                    <div className="space-y-2">
                      {reasons.map((reason) => (
                        <Card key={reason.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{reason.name}</span>
                              {reason.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {reason.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={reason.requires_customer ? "default" : "secondary"}>
                                {reason.requires_customer ? "Requer Cliente" : "Sem Cliente"}
                              </Badge>
                              <Badge variant={reason.requires_seller ? "default" : "secondary"}>
                                {reason.requires_seller ? "Requer Vendedor" : "Sem Vendedor"}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
              
              <FeatureFlagWrapper flag={FEATURE_FLAGS.REASON_WORKFLOWS}>
                <MemoizedReasonWorkflowManager />
              </FeatureFlagWrapper>
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <FeatureFlagWrapper flag={FEATURE_FLAGS.GRANULAR_PERMISSIONS}>
            <TabsContent value="roles">
              <MemoizedRoleManagement />
            </TabsContent>
          </FeatureFlagWrapper>

          {/* Reports Tab */}
          <FeatureFlagWrapper flag={FEATURE_FLAGS.ADVANCED_REPORTING}>
            <TabsContent value="reports">
              <div className="space-y-6">
                <MemoizedSmartReporting />
                
                <FeatureFlagWrapper flag={FEATURE_FLAGS.REAL_TIME_SYNC}>
                  <MemoizedRealTimeSync />
                </FeatureFlagWrapper>
                
                <FeatureFlagWrapper flag={FEATURE_FLAGS.OFFLINE_QUEUE}>
                  <MemoizedOfflineQueue />
                </FeatureFlagWrapper>
              </div>
            </TabsContent>
          </FeatureFlagWrapper>

          {/* Deploy Canário Tab */}
          <TabsContent value="deploy">
            <SystemFeaturesGuard>
              <div className="space-y-6">
                <MemoizedCanaryDeploymentDashboard />
                <MemoizedCanaryMetricsCollector />
              </div>
            </SystemFeaturesGuard>
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="features">
            <SystemFeaturesGuard>
              <MemoizedFeatureFlagsAdmin />
            </SystemFeaturesGuard>
          </TabsContent>


          {/* Config Tab */}
          <TabsContent value="config">
            <Card>
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-bold">Configurações do Sistema</h2>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Cliente Avulso</h3>
                    <p className="text-sm text-muted-foreground">
                      Permite registrar saídas com cliente digitado livremente
                    </p>
                  </div>
                  <Switch
                    checked={guestCustomerEnabled}
                    onCheckedChange={setGuestCustomerEnabled}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
