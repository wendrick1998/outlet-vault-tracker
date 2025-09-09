// Mock Data for Cofre Tracker - Outlet Store Plus
// This simulates the Supabase data structure for prototyping

export interface MockInventory {
  id: string;
  imei: string;
  imeiSuffix5: string;
  model: string;
  color: string;
  type: 'smartphone' | 'tablet' | 'watch' | 'accessory';
  status: 'cofre' | 'fora' | 'vendido';
  notes: MockItemNote[];
}

export interface MockReason {
  id: string;
  name: string;
  requiresCustomer: boolean;
  slaHours?: number;
  sortOrder: number;
}

export interface MockSeller {
  id: string;
  name: string;
  whatsapp: string;
  active: boolean;
}

export interface MockCustomer {
  id: string;
  name: string;
  whatsapp: string;
  type: 'registered' | 'guest';
}

export interface MockLoan {
  id: string;
  inventoryId: string;
  reasonId: string;
  sellerId: string;
  customerId?: string;
  customerName?: string; // For guest customers
  outAt: string; // ISO date
  dueAt?: string; // ISO date
  returnedAt?: string;
  soldAt?: string;
  saleNumber?: string;
  quickNote?: string;
}

export interface MockItemNote {
  id: string;
  inventoryId: string;
  note: string;
  createdAt: string;
  author: string;
  tag?: string;
}

// Mock Data Collections
export const mockInventory: MockInventory[] = [
  {
    id: '1',
    imei: '123456789012345',
    imeiSuffix5: '12345',
    model: 'iPhone 13',
    color: 'Azul',
    type: 'smartphone',
    status: 'cofre',
    notes: []
  },
  {
    id: '2',
    imei: '234567890123456',
    imeiSuffix5: '23456',
    model: 'iPhone 12',
    color: 'Branco',
    type: 'smartphone',
    status: 'fora',
    notes: [
      {
        id: 'n1',
        inventoryId: '2',
        note: 'Tela com pequeno risco no canto inferior',
        createdAt: '2024-01-08T10:30:00Z',
        author: 'Operadora',
        tag: 'defeito'
      }
    ]
  },
  {
    id: '3',
    imei: '345678901234567',
    imeiSuffix5: '34567',
    model: 'iPhone 11',
    color: 'Preto',
    type: 'smartphone',
    status: 'cofre',
    notes: []
  },
  {
    id: '4',
    imei: '456789012345678',
    imeiSuffix5: '45678',
    model: 'iPad Air 5ª Gen',
    color: 'Cinza Espacial',
    type: 'tablet',
    status: 'fora',
    notes: []
  },
  {
    id: '5',
    imei: '567890123456789',
    imeiSuffix5: '56789',
    model: 'Apple Watch Series 8',
    color: 'Meia-Noite',
    type: 'watch',
    status: 'cofre',
    notes: []
  },
  {
    id: '6',
    imei: '678901234567890',
    imeiSuffix5: '67890',
    model: 'iPhone 13 Pro',
    color: 'Dourado',
    type: 'smartphone',
    status: 'vendido',
    notes: []
  },
  {
    id: '7',
    imei: '789012345678901',
    imeiSuffix5: '78901',
    model: 'AirPods Pro 2ª Gen',
    color: 'Branco',
    type: 'accessory',
    status: 'cofre',
    notes: []
  },
  {
    id: '8',
    imei: '890123456789012',
    imeiSuffix5: '89012',
    model: 'iPad Pro 11"',
    color: 'Prata',
    type: 'tablet',
    status: 'fora',
    notes: []
  },
  {
    id: '9',
    imei: '350839224453446',
    imeiSuffix5: '53446',
    model: 'Samsung Galaxy S23',
    color: 'Preto',
    type: 'smartphone',
    status: 'cofre',
    notes: []
  },
  {
    id: '10',
    imei: '356598107137286',
    imeiSuffix5: '37286',
    model: 'iPhone 14 Pro',
    color: 'Roxo Profundo',
    type: 'smartphone',
    status: 'cofre',
    notes: []
  },
  {
    id: '11',
    imei: '354746820095545',
    imeiSuffix5: '95545',
    model: 'Xiaomi 13 Pro',
    color: 'Branco',
    type: 'smartphone',
    status: 'cofre',
    notes: []
  }
];

export const mockReasons: MockReason[] = [
  {
    id: '1',
    name: 'Demonstração',
    requiresCustomer: false,
    slaHours: 2,
    sortOrder: 1
  },
  {
    id: '2',
    name: 'Conteúdo',
    requiresCustomer: false,
    slaHours: 4,
    sortOrder: 2
  },
  {
    id: '3',
    name: 'Conferência',
    requiresCustomer: false,
    slaHours: 1,
    sortOrder: 3
  },
  {
    id: '4',
    name: 'Empréstimo',
    requiresCustomer: true,
    slaHours: 72,
    sortOrder: 4
  },
  {
    id: '5',
    name: 'Venda',
    requiresCustomer: true,
    sortOrder: 5
  }
];

export const mockSellers: MockSeller[] = [
  { id: '1', name: 'Maria Silva', whatsapp: '(47) 99999-0001', active: true },
  { id: '2', name: 'João Costa', whatsapp: '(47) 99999-0002', active: true },
  { id: '3', name: 'Ana Santos', whatsapp: '(47) 99999-0003', active: true },
  { id: '4', name: 'Pedro Oliveira', whatsapp: '(47) 99999-0004', active: true },
  { id: '5', name: 'Carla Mendes', whatsapp: '(47) 99999-0005', active: true }
];

export const mockCustomers: MockCustomer[] = [
  { id: '1', name: 'Roberto Carlos', whatsapp: '(47) 99999-1111', type: 'registered' },
  { id: '2', name: 'Fernanda Lima', whatsapp: '(47) 99999-2222', type: 'registered' },
  { id: '3', name: 'Carlos Eduardo', whatsapp: '(47) 99999-3333', type: 'registered' },
  { id: '4', name: 'Patrícia Ramos', whatsapp: '(47) 99999-4444', type: 'registered' },
  { id: '5', name: 'Ricardo Gomes', whatsapp: '(47) 99999-5555', type: 'registered' },
  { id: '6', name: 'Juliana Ferreira', whatsapp: '(47) 99999-6666', type: 'registered' },
  { id: '7', name: 'Marcos Antonio', whatsapp: '(47) 99999-7777', type: 'registered' },
  { id: '8', name: 'Luciana Barbosa', whatsapp: '(47) 99999-8888', type: 'registered' }
];

// Active loans for testing "Fora Agora" functionality
export const mockLoans: MockLoan[] = [
  {
    id: 'l1',
    inventoryId: '2', // iPhone 12 Branco
    reasonId: '1', // Demonstração
    sellerId: '1', // Maria Silva
    outAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    dueAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Due 1 hour ago (OVERDUE)
    quickNote: 'Para demonstração na vitrine'
  },
  {
    id: 'l2',
    inventoryId: '4', // iPad Air
    reasonId: '4', // Empréstimo
    sellerId: '2', // João Costa
    customerId: '3', // Carlos Eduardo
    outAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due in 24 hours
    quickNote: 'Cliente testando por fim de semana'
  },
  {
    id: 'l3',
    inventoryId: '8', // iPad Pro
    reasonId: '2', // Conteúdo
    sellerId: '3', // Ana Santos
    outAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    dueAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // Due in 3 hours
    quickNote: 'Gravação de vídeo promocional'
  }
];

// Helper functions for mock data operations
export class MockDataService {
  static findItemByIMEI(imei: string): MockInventory | undefined {
    if (imei.length === 15) {
      return mockInventory.find(item => item.imei === imei);
    }
    return undefined;
  }

  static findItemsBySuffix(suffix: string): MockInventory[] {
    if (suffix.length === 5) {
      return mockInventory.filter(item => item.imeiSuffix5 === suffix);
    }
    return [];
  }

  static getActiveLoans(): MockLoan[] {
    return mockLoans.filter(loan => !loan.returnedAt && !loan.soldAt);
  }

  // Enhanced loan methods with populated data
  static getLoanWithDetails(loan: MockLoan) {
    const item = mockInventory.find(i => i.id === loan.inventoryId);
    const reason = mockReasons.find(r => r.id === loan.reasonId);
    const seller = mockSellers.find(s => s.id === loan.sellerId);
    const customer = loan.customerId ? mockCustomers.find(c => c.id === loan.customerId) : null;

    return {
      ...loan,
      item,
      reason,
      seller,
      customer
    };
  }

  static getAllLoansWithDetails() {
    return mockLoans.map(loan => this.getLoanWithDetails(loan));
  }

  static getActiveLoansWithDetails() {
    return this.getActiveLoans().map(loan => this.getLoanWithDetails(loan));
  }

  static isOverdue(loan: MockLoan): boolean {
    if (!loan.dueAt) return false;
    return new Date(loan.dueAt) < new Date();
  }

  static getTimeElapsed(loan: MockLoan): string {
    const now = new Date();
    const outTime = new Date(loan.outAt);
    const diffMs = now.getTime() - outTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}min`;
    }
    return `${diffMins}min`;
  }

  static getTimeUntilDue(loan: MockLoan): string {
    if (!loan.dueAt) return '';
    
    const now = new Date();
    const dueTime = new Date(loan.dueAt);
    const diffMs = dueTime.getTime() - now.getTime();
    
    if (diffMs < 0) {
      const overdue = Math.abs(diffMs);
      const overdueHours = Math.floor(overdue / (1000 * 60 * 60));
      return `Atrasado ${overdueHours}h`;
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}min`;
  }

  // Mock data getters
  static get mockInventory() { return mockInventory; }
  static get mockReasons() { return mockReasons; }
  static get mockSellers() { return mockSellers; }
  static get mockCustomers() { return mockCustomers; }
  static get mockLoans() { return mockLoans; }

  // Additional utility methods
  static validateIMEI(imei: string): { isValid: boolean; message?: string } {
    const cleanIMEI = imei.replace(/\D/g, '');
    
    if (cleanIMEI.length !== 15) {
      return { isValid: false, message: "IMEI deve ter exatamente 15 dígitos" };
    }
    
    const exists = this.findItemByIMEI(cleanIMEI);
    if (exists) {
      return { isValid: false, message: "IMEI já existe no sistema" };
    }
    
    return { isValid: true };
  }

  static getSystemStats() {
    const totalItems = mockInventory.length;
    const activeLoans = this.getActiveLoans().length;
    const overdueLoans = this.getActiveLoans().filter(loan => this.isOverdue(loan)).length;
    const soldItems = mockInventory.filter(item => item.status === 'vendido').length;
    const availableItems = mockInventory.filter(item => item.status === 'cofre').length;

    return {
      totalItems,
      activeLoans,
      overdueLoans,
      soldItems,
      availableItems
    };
  }
}