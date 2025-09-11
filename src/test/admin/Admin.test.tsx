import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Admin } from '@/pages/Admin';

// Mock the hooks
vi.mock('@/hooks/useInventory', () => ({
  useInventory: () => ({
    items: [],
    isLoading: false,
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn()
  })
}));

vi.mock('@/hooks/useReasons', () => ({
  useReasons: () => ({
    reasons: [],
    isLoading: false,
    createReason: vi.fn(),
    updateReason: vi.fn(),
    deleteReason: vi.fn()
  })
}));

vi.mock('@/hooks/useSellers', () => ({
  useSellers: () => ({
    sellers: [],
    isLoading: false,
    createSeller: vi.fn(),
    updateSeller: vi.fn(),
    deleteSeller: vi.fn()
  })
}));

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({
    customers: [],
    isLoading: false,
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn()
  })
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const AdminWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Admin Component', () => {
  it('renders without crashing', () => {
    const mockOnBack = vi.fn();
    
    const { container } = render(
      <AdminWrapper>
        <Admin onBack={mockOnBack} />
      </AdminWrapper>
    );

    expect(container).toBeTruthy();
  });

  it('contains admin content', () => {
    const mockOnBack = vi.fn();
    
    const { getByText } = render(
      <AdminWrapper>
        <Admin onBack={mockOnBack} />
      </AdminWrapper>
    );

    expect(getByText('Administração')).toBeInTheDocument();
  });
});