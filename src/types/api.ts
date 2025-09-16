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

// Advanced Search Types
export interface AdvancedSearchResult {
  id: string;
  model: string;
  brand: string;
  imei?: string;
  status: string;
  color?: string;
  storage?: string;
  [key: string]: unknown;
}

export interface AdvancedSearchFilters {
  brand?: string;
  model?: string;
  color?: string;
  status?: string;
  storage?: string;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  includeArchived?: boolean;
}

// Batch Operations Types  
export interface BatchImportResult {
  created?: number;
  errors?: number;
  total?: number;
  error_details?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface BulkOperationData {
  reason_id?: string;
  notes?: string;
  customer_id?: string;
  seller_id?: string;
  due_at?: string;
  [key: string]: unknown;
}

// Audit Types
export interface AuditDetails {
  [key: string]: unknown;
}

// Conference Report Types
export interface ConferenceReportData {
  audit: {
    id: string;
    location: string;
    status: string;
    started_at: string;
    finished_at?: string;
    snapshot_count: number;
    found_count: number;
    missing_count: number;
    unexpected_count: number;
    duplicate_count: number;
    incongruent_count: number;
    notes?: string;
  };
  scans: ConferenceScan[];
  missing: MissingItem[];
  tasks: ConferenceTask[];
}

export interface ConferenceScan {
  timestamp: string;
  imei?: string;
  serial?: string;
  raw_code: string;
  scan_result: string;
  item_id?: string;
}

export interface MissingItem {
  item_id: string;
  reason: string;
  item?: {
    model: string;
    brand: string;
    imei?: string;
    status: string;
  };
  item_details?: {
    model?: string;
    brand?: string;
    imei?: string;
    status?: string;
  };
}

export interface ConferenceTask {
  id: string;
  task_type: string;
  description: string;
  priority: string;
  status: string;
  imei?: string;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

// Device Action Types
export interface DeviceItem {
  id: string;
  brand: string;
  model: string;
  imei?: string;
  status: string;
  is_archived: boolean;
}

export interface DeviceActionData {
  isOpen: boolean;
  type: 'archive' | 'delete' | 'restore';
  item: DeviceItem;
}

// Offline Queue Types
export interface OfflineQueueAction {
  id: string;
  type: 'create_loan' | 'update_loan' | 'create_item' | 'update_item';
  data: Record<string, unknown>;
  timestamp: Date;
  retries: number;
  status: 'pending' | 'failed' | 'synced';
}

// Scan Feedback Types
export interface ScanFeedbackData {
  type: 'scanning' | 'success' | 'warning' | 'error';
  message: string;
  details: string;
  item?: {
    id: string;
    brand: string;
    model: string;
    status: string;
    imei?: string;
    suffix?: string;
  };
}

// Smart Form Helper Types
export interface SmartFormData {
  customer_id?: string;
  seller_id?: string;
  due_at?: string;
  [key: string]: unknown;
}

export interface SmartSuggestion {
  id: string;
  name: string;
  reason: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SmartValidation {
  isValid: boolean;
  confidence: number;
  risks?: string[];
  recommendations?: string[];
  filledFields?: Record<string, unknown>;
  suggestedDate?: string;
  reasoning?: string;
  alternatives?: Array<{date: string; reason: string}>;
}

// General utility types
export type NonNullable<T> = T extends null | undefined ? never : T;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;