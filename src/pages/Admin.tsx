import { useState } from "react";
import { Settings, Package, Users, UserCheck, Tag, Plus, Edit, Trash2, Upload } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  type CustomerFormData
} from "@/types/admin";
import { itemSchema, reasonSchema, sellerSchema, customerSchema } from "@/lib/validation";

interface AdminProps {
  onBack: () => void;
}

export const Admin = ({ onBack }: AdminProps) => {
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<AdminModal>("none");
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    type: "",
    item: null
  });

  const { 
    items, 
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

  // Modal handlers
  const openModal = (type: AdminModal, item?: any) => {
    setActiveModal(type);
    setEditingItem(item || null);
    
    if (item) {
      switch (type) {
        case "item":
          setItemForm({
            imei: item.imei,
            model: item.model,
            color: item.color,
            brand: item.brand,
            storage: item.storage || ""
          });
          break;
        case "reason":
          setReasonForm({
            name: item.name,
            description: item.description || "",
            requires_customer: item.requires_customer,
            requires_seller: item.requires_seller
          });
          break;
        case "seller":
          setSellerForm({
            name: item.name,
            phone: item.phone || "",
            email: item.email || ""
          });
          break;
        case "customer":
          setCustomerForm({
            name: item.name,
            phone: item.phone || "",
            email: item.email || ""
          });
          break;
      }
    } else {
      // Reset forms
      setItemForm({ imei: "", model: "", color: "", brand: "", storage: "" });
      setReasonForm({ name: "", description: "", requires_customer: false, requires_seller: false });
      setSellerForm({ name: "", phone: "", email: "" });
      setCustomerForm({ name: "", phone: "", email: "" });
    }
  };

  const closeModal = () => {
    setActiveModal("none");
    setEditingItem(null);
  };

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

  const handleDelete = (type: string, item: any) => {
    setConfirmModal({
      isOpen: true,
      type,
      item
    });
  };

  const confirmDelete = async () => {
    try {
      const { type, item } = confirmModal;
      
      if (type === "item") {
        await deleteItem(item.id);
      } else if (type === "reason") {
        await deleteReason(item.id);
      } else if (type === "seller") {
        await deleteSeller(item.id);
      } else if (type === "customer") {
        await deleteCustomer(item.id);
      }
      
      toast({
        title: "Item removido",
        description: "O item foi removido com sucesso",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive"
      });
    }
    
    setConfirmModal({ isOpen: false, type: "", item: null });
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Importação iniciada",
        description: `Processando arquivo: ${file.name}`,
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              Itens
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
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Gestão de Itens</h2>
                  <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      Importar CSV
                    </Button>
                    <Button onClick={() => openModal("item")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Item
                    </Button>
                  </div>
                </div>

                {inventoryLoading ? (
                  <Loading />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">...{item.imei.slice(-5)}</TableCell>
                          <TableCell>{item.brand}</TableCell>
                          <TableCell>{item.model}</TableCell>
                          <TableCell>{item.color}</TableCell>
                          <TableCell>
                            <Badge variant={
                              item.status === "available" ? "default" : 
                              item.status === "loaned" ? "secondary" : "destructive"
                            }>
                              {item.status === "available" ? "Disponível" : 
                               item.status === "loaned" ? "Emprestado" : "Vendido"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline" 
                                size="sm"
                                onClick={() => openModal("item", item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm" 
                                onClick={() => handleDelete("item", item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Reasons Tab */}
          <TabsContent value="reasons">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Motivos de Saída</h2>
                  <Button onClick={() => openModal("reason")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Motivo
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Exige Cliente</TableHead>
                      <TableHead>SLA (horas)</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reasons.map((reason) => (
                      <TableRow key={reason.id}>
                        <TableCell>{reason.name}</TableCell>
                        <TableCell>
                          {reason.requires_customer ? (
                            <Badge variant="secondary">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => openModal("reason", reason)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm" 
                              onClick={() => handleDelete("reason", reason)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Vendedores</h2>
                  <Button onClick={() => openModal("seller")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Vendedor
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell>{seller.name}</TableCell>
                        <TableCell className="font-mono">{seller.phone}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => openModal("seller", seller)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm" 
                              onClick={() => handleDelete("seller", seller)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Clientes</h2>
                  <Button onClick={() => openModal("customer")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Cliente
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell className="font-mono">{customer.phone}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => openModal("customer", customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm" 
                              onClick={() => handleDelete("customer", customer)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
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

                <div className="pt-6 border-t">
                  <h3 className="font-medium mb-4">Backup e Restore</h3>
                  <div className="flex gap-3">
                    <Button variant="outline">Fazer Backup</Button>
                    <Button variant="outline">Restaurar Backup</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Item Modal */}
      {activeModal === "item" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {editingItem ? "Editar Item" : "Adicionar Item"}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">IMEI</label>
                  <Input
                    value={itemForm.imei}
                    onChange={(e) => setItemForm({...itemForm, imei: e.target.value})}
                    placeholder="15 dígitos"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Modelo</label>
                  <Input
                    value={itemForm.model}
                    onChange={(e) => setItemForm({...itemForm, model: e.target.value})}
                    placeholder="ex: iPhone 13 Pro"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <Input
                    value={itemForm.color}
                    onChange={(e) => setItemForm({...itemForm, color: e.target.value})}
                    placeholder="ex: Azul Sierra"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={closeModal} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  {editingItem ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: "", item: null })}
        onConfirm={confirmDelete}
        title="Confirmar exclusão"
        description="Esta ação não pode ser desfeita. Tem certeza?"
        variant="destructive"
      />
    </div>
  );
};