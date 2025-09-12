import { useState } from "react";
import { Plus, Search, Edit, Trash, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/useCustomers";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/hooks/use-toast";
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

export const AdminCustomersTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { toast } = useToast();
  const { customers = [], isLoading, deleteCustomer, isDeleting } = useCustomers();

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
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Clientes</h2>
            <p className="text-muted-foreground">
              Cadastre e gerencie clientes para empréstimos
            </p>
          </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      {customer.is_registered && (
                        <Badge variant="secondary">Registrado</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {formatPhone(customer.phone)}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {customer.email}
                        </div>
                      )}
                      {customer.cpf && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          CPF: {formatCPF(customer.cpf)}
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {customer.address}
                        </div>
                      )}
                    </div>
                    
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
    </div>
  );
};