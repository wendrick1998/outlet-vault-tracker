/**
 * Centralized Query Keys Factory
 * Eliminates duplicação de 15+ QUERY_KEYS similares nos hooks
 */

export const createQueryKeys = <T extends string>(entity: T) => ({
  all: [entity] as const,
  lists: () => [...createQueryKeys(entity).all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...createQueryKeys(entity).lists(), { filters }] as const,
  details: () => [...createQueryKeys(entity).all, 'detail'] as const,
  detail: (id: string | number) => [...createQueryKeys(entity).details(), id] as const,
  searches: () => [...createQueryKeys(entity).all, 'search'] as const,
  search: (term: string) => [...createQueryKeys(entity).searches(), term] as const,
  stats: () => [...createQueryKeys(entity).all, 'stats'] as const,
  mutations: () => [...createQueryKeys(entity).all, 'mutations'] as const,
});

// Pre-built keys para entidades principais
export const QUERY_KEYS = {
  customers: createQueryKeys('customers'),
  inventory: createQueryKeys('inventory'),
  loans: createQueryKeys('loans'),
  sales: createQueryKeys('sales'),
  users: createQueryKeys('users'),
  audit: createQueryKeys('audit'),
  devices: createQueryKeys('devices'),
  stats: createQueryKeys('stats'),
  permissions: createQueryKeys('permissions'),
  sessions: createQueryKeys('sessions'),
  catalogs: createQueryKeys('catalogs'),
  reasons: createQueryKeys('reasons'),
  profiles: createQueryKeys('profiles'),
  pendingLoans: createQueryKeys('pendingLoans'),
  pendingSales: createQueryKeys('pendingSales'),
  devicesLeftAtStore: createQueryKeys('devicesLeftAtStore'),
} as const;

export type QueryKeys = typeof QUERY_KEYS;
export type EntityKeys = keyof QueryKeys;