import { useState, useEffect } from 'react';
import { CustomerService } from '@/services/customerService';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

export function useSecureCustomerEdit(customerId?: string) {
  const [secureCustomer, setSecureCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setSecureCustomer(null);
      return;
    }

    const loadSecureCustomerData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use administrative access method for editing - this is audited
        const customer = await CustomerService.getForAdministration(customerId);
        setSecureCustomer(customer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer data');
        console.error('Error loading secure customer data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSecureCustomerData();
  }, [customerId]);

  return {
    secureCustomer,
    isLoading,
    error
  };
}