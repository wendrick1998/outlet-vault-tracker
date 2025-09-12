import { z } from 'zod';

// Common validation schemas
export const itemSchema = z.object({
  imei: z.string()
    .min(15, 'IMEI deve ter pelo menos 15 caracteres')
    .max(17, 'IMEI deve ter no máximo 17 caracteres')
    .regex(/^\d+$/, 'IMEI deve conter apenas números'),
  model: z.string()
    .min(1, 'Modelo é obrigatório')
    .max(100, 'Modelo deve ter no máximo 100 caracteres'),
  brand: z.string()
    .min(1, 'Marca é obrigatória')
    .max(50, 'Marca deve ter no máximo 50 caracteres'),
  color: z.string()
    .min(1, 'Cor é obrigatória')
    .max(30, 'Cor deve ter no máximo 30 caracteres'),
  storage: z.string()
    .min(1, 'Armazenamento é obrigatório')
    .max(20, 'Armazenamento deve ter no máximo 20 caracteres'),
  notes: z.string().optional(),
});

export const reasonSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  requires_customer: z.boolean(),
  requires_seller: z.boolean(),
});

export const sellerSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 caracteres')
    .max(15, 'Telefone deve ter no máximo 15 caracteres')
    .regex(/^\+?[\d\s()-]+$/, 'Formato de telefone inválido'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
});

export const customerSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 caracteres')
    .max(15, 'Telefone deve ter no máximo 15 caracteres')
    .regex(/^\+?[\d\s()-]+$/, 'Formato de telefone inválido'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .optional(),
  cpf: z.string()
    .length(11, 'CPF deve ter 11 dígitos')
    .regex(/^\d{11}$/, 'CPF deve conter apenas números')
    .optional(),
  address: z.string()
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .optional(),
  loan_limit: z.number()
    .min(1, 'Limite mínimo é 1')
    .max(50, 'Limite máximo é 50')
    .optional(),
  notes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
});

export const quickCustomerSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  cpf: z.string()
    .optional()
    .refine((val) => !val || (val.length === 11 && /^\d{11}$/.test(val)), 
      'CPF deve ter 11 dígitos numéricos'),
  phone: z.string()
    .optional()
    .refine((val) => !val || (val.length >= 10 && val.length <= 15 && /^\+?[\d\s()-]+$/.test(val)), 
      'Formato de telefone inválido'),
  loan_reason: z.string()
    .max(200, 'Motivo deve ter no máximo 200 caracteres')
    .optional(),
});

export const loanSchema = z.object({
  item_id: z.string().uuid('Item ID inválido'),
  customer_id: z.string().uuid('Cliente ID inválido'),
  seller_id: z.string().uuid('Vendedor ID inválido'),
  reason_id: z.string().uuid('Motivo ID inválido'),
  due_at: z.date().min(new Date(), 'Data de vencimento deve ser futura'),
  notes: z.string().optional(),
});

// Type exports
export type ItemFormData = z.infer<typeof itemSchema>;
export type ReasonFormData = z.infer<typeof reasonSchema>;
export type SellerFormData = z.infer<typeof sellerSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type QuickCustomerFormData = z.infer<typeof quickCustomerSchema>;
export type LoanFormData = z.infer<typeof loanSchema>;