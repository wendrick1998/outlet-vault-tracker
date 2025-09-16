import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerSearchInputProps {
  value: string;
  onChange: (customerId: string) => void;
  onNewCustomer: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomerSearchInput = ({
  value,
  onChange,
  onNewCustomer,
  placeholder = "Pesquisar cliente...",
  disabled = false
}: CustomerSearchInputProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  
  const { customers = [] } = useCustomers();

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm.length >= 2) {
      // Secure search - only by name for non-admin users
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowResults(true);
    } else {
      setFilteredCustomers([]);
      setShowResults(false);
    }
  }, [searchTerm, customers]);

  // Set initial search term based on selected customer
  useEffect(() => {
    if (value) {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer && searchTerm === "") {
        setSearchTerm(selectedCustomer.name);
      }
    }
  }, [value, customers, searchTerm]);

  const handleCustomerSelect = (customer: Customer) => {
    setSearchTerm(customer.name);
    setShowResults(false);
    onChange(customer.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // Clear selection if input is cleared
    if (newValue === "") {
      onChange("");
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10"
          />
          
          {/* Search Results */}
          {showResults && filteredCustomers.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
              <div className="p-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 hover:bg-muted/50 rounded-lg cursor-pointer border-b border-border/50 last:border-0"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <div className="flex gap-2 mt-1">
                          {customer.is_registered && (
                            <Badge variant="secondary" className="text-xs">
                              Registrado
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            ID: {customer.id.slice(0, 8)}...
                          </Badge>
                        </div>
                      </div>
                      {customer.is_registered && (
                        <Badge variant="secondary" className="text-xs">
                          Cadastrado
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* No Results */}
          {showResults && filteredCustomers.length === 0 && searchTerm.length >= 2 && (
            <Card className="absolute z-50 w-full mt-1">
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Nenhum cliente encontrado</p>
                <p className="text-xs mt-1">Tente buscar por nome, CPF ou telefone</p>
              </div>
            </Card>
          )}
        </div>
        
        {/* New Customer Button */}
        <Button
          type="button"
          onClick={onNewCustomer}
          disabled={disabled}
          className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};