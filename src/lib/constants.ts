// Application constants and configuration

export const APP_CONFIG = {
  name: 'Cofre Tracker',
  version: '2.0.0',
  description: 'Sistema de controle de empréstimos do cofre - Outlet Store Plus Blumenau',
  company: 'Outlet Store Plus',
  author: 'Wendrick Leal',
} as const;

export const API_CONFIG = {
  defaultStaleTime: 1000 * 60 * 5, // 5 minutes
  defaultCacheTime: 1000 * 60 * 30, // 30 minutes
  retryCount: 3,
  retryDelay: 1000,
} as const;

export const UI_CONFIG = {
  toastDuration: 5000,
  loadingDelay: 300,
  animationDuration: 200,
  debounceDelay: 500,
} as const;

export const PWA_CONFIG = {
  name: APP_CONFIG.name,
  shortName: 'CofreTracker',
  description: APP_CONFIG.description,
  themeColor: '#4f46e5',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait-primary',
} as const;

// Status constants for better type safety
export const INVENTORY_STATUS = {
  AVAILABLE: 'available',
  LOANED: 'loaned', 
  SOLD: 'sold',
} as const;

export const LOAN_STATUS = {
  ACTIVE: 'active',
  RETURNED: 'returned', 
  OVERDUE: 'overdue',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user', 
  AUDITOR: 'auditor',
} as const;

// Validation constants
export const VALIDATION = {
  minPasswordLength: 6,
  maxNameLength: 100,
  maxEmailLength: 255,
  maxNotesLength: 1000,
  imeiPattern: /^\d{15}$/,
  phonePattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
} as const;