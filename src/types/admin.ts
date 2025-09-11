import type { Database } from '@/integrations/supabase/types';

// Admin types for better type safety
export type InventoryItem = Database['public']['Tables']['inventory']['Row'];
export type Reason = Database['public']['Tables']['reasons']['Row'];
export type Seller = Database['public']['Tables']['sellers']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];

export type AdminModal = "none" | "item" | "reason" | "seller" | "customer";

export interface EditingItem {
  id?: string;
  type: AdminModal;
  data: InventoryItem | Reason | Seller | Customer | null;
}

export interface ConfirmModalState {
  isOpen: boolean;
  type: string;
  item: InventoryItem | Reason | Seller | Customer | null;
}

export interface ItemFormData {
  imei: string;
  model: string;
  brand: string;
  color: string;
  storage: string;
  notes?: string;
}

export interface ReasonFormData {
  name: string;
  description: string;
  requires_customer: boolean;
  requires_seller: boolean;
}

export interface SellerFormData {
  name: string;
  phone: string;
  email: string;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
}