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
    .max(255, 'Email deve ter no máximo 255 caracteres'),
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
export type LoanFormData = z.infer<typeof loanSchema>;