import { useState } from "react";
import { Plus, Search, Edit, Trash, Phone, Mail, MapPin, CreditCard, AlertTriangle, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SensitiveDataDisplay } from "@/components/SensitiveDataDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

export const AdminCustomersTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isClearTestModalOpen, setIsClearTestModalOpen] = useState(false);

  const { toast } = useToast();
  const { profile } = useAuth();
  const { 
    customers = [], 
    isLoading, 
    deleteCustomer, 
    isDeleting,
    clearTestData,
    isClearingTestData 
  } = useCustomers();

  // Determine user role for security display
  const userRole = profile?.role === 'admin' ? 'admin' : 
                   profile?.role === 'manager' ? 'manager' : 'user';

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf?.includes(searchTerm)
  );

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    deleteCustomer(customerToDelete.id, {
      onSuccess: () => {
        toast({
          title: "Cliente deletado",
          description: `${customerToDelete.name} foi removido com sucesso`,
        });
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
      },
      onError: () => {
        toast({
          title: "Erro ao deletar",
          description: "Não foi possível deletar o cliente",
          variant: "destructive"
        });
      }
    });
  };

  const handleClearTestData = () => {
    setIsClearTestModalOpen(true);
  };

  const confirmClearTestData = () => {
    clearTestData();
    setIsClearTestModalOpen(false);
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf || cpf.length !== 11) return cpf;
    return `${cpf.slice(0,3)}.${cpf.slice(3,6)}.${cpf.slice(6,9)}-${cpf.slice(9)}`;
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return phone;
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Gerenciar Clientes</h2>
              <p className="text-muted-foreground">
                Cadastre e gerencie clientes com proteção de dados avançada
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearTestData}
              className="gap-2 text-destructive hover:text-destructive"
              disabled={isClearingTestData}
            >
              <AlertTriangle className="h-4 w-4" />
              {isClearingTestData ? "Limpando..." : "Limpar Dados de Teste"}
            </Button>
            <Button
              onClick={() => {
                setSelectedCustomer(null);
                setIsFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-800">
            <Shield className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Proteção de Dados Pessoais</h3>
              <p className="text-sm mt-1">
                Dados sensíveis (email, telefone, CPF) estão protegidos e requerem acesso temporário autorizado.
                Todos os acessos são auditados para conformidade com LGPD.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando clientes...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      {customer.is_registered && (
                        <Badge variant="secondary">Registrado</Badge>
                      )}
                    </div>
                    
                    {/* Secure sensitive data display */}
                    <SensitiveDataDisplay 
                      customer={customer} 
                      userRole={userRole}
                    />
                    
                    {customer.address && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {customer.address}
                      </div>
                    )}
                    
                    {customer.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {customer.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(customer)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(customer)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Form Dialog */}
      <CustomerFormDialog
        customer={selectedCustomer}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => setIsFormOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Deletar Cliente"
        description={`Tem certeza que deseja deletar ${customerToDelete?.name}? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        variant="destructive"
      />

      {/* Clear Test Data Confirmation */}
      <ConfirmModal
        isOpen={isClearTestModalOpen}
        onClose={() => setIsClearTestModalOpen(false)}
        onConfirm={confirmClearTestData}
        title="Limpar Dados de Teste"
        description="Esta ação irá remover todos os clientes de teste que não possuem empréstimos ativos. Clientes com empréstimos serão preservados. Esta ação não pode ser desfeita."
        confirmText="Limpar Dados"
        variant="destructive"
      />
    </div>
  );
};