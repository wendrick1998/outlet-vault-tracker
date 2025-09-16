import type { Database } from '@/integrations/supabase/types';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// AI Types
export interface AIRequest {
  type: 'search' | 'suggest' | 'predict' | 'analyze' | 'validate';
  data?: Record<string, unknown>;
  context?: string;
}

export interface AIResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  code?: string;
}

// Audit Types
export interface AuditLogEntry {
  action: string;
  details?: Record<string, unknown>;
  tableName?: string;
  recordId?: string;
}

// Form Types
export interface FormValidationRule<T> {
  field: keyof T;
  validator: (value: unknown) => { valid: boolean; message?: string };
}

// Analytics Types
export interface AnalyticsEvent {
  action: string;
  target?: string;
  value?: Record<string, unknown>;
}

// Inventory Audit Types
export interface InventoryAuditUpdate {
  id: string;
  updates: Record<string, unknown>;
}

// Import Types
export interface ImportResult {
  success: boolean;
  processed: number;
  errors?: number;
  error_details?: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

// Loan Types
export interface PendingLoanUpdate {
  id: string;
  customerData: Record<string, unknown>;
  notes?: string;
}

// Service Types
export interface ServiceResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

// PIN Service Types
export interface PinSetupResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PinValidationResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Monitoring Types  
export interface VitalMetric {
  id: string;
  name: string;
  value: number;
  rating: 'poor' | 'needs-improvement' | 'good';
  delta?: number;
  url?: string;
  navigationType?: string;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  source?: string;
}

// General utility types
export type NonNullable<T> = T extends null | undefined ? never : T;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;