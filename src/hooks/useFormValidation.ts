import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any) => { valid: boolean; message?: string };
}

export interface UseFormValidationOptions<T> {
  schema?: z.ZodSchema<T>;
  rules?: ValidationRule<T>[];
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  rules = [],
  onSuccess,
  onError
}: UseFormValidationOptions<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateField = useCallback((field: keyof T, value: any): string | null => {
    // Check custom rules first
    const rule = rules.find(r => r.field === field);
    if (rule) {
      const result = rule.validator(value);
      if (!result.valid) {
        return result.message || 'Valor inválido';
      }
    }

    // If schema is provided, validate with zod
    if (schema && 'shape' in schema) {
      try {
        const fieldSchema = (schema as any).shape[field as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.issues[0]?.message || 'Valor inválido';
        }
      }
    }

    return null;
  }, [schema, rules]);

  const validateForm = useCallback(async (data: T): Promise<boolean> => {
    setIsValidating(true);
    const newErrors: Record<string, string> = {};

    // Validate all fields
    for (const [field, value] of Object.entries(data)) {
      const error = validateField(field as keyof T, value);
      if (error) {
        newErrors[field] = error;
      }
    }

    // Schema validation
    if (schema) {
      try {
        schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.issues.forEach(err => {
            const field = err.path.join('.');
            if (!newErrors[field]) {
              newErrors[field] = err.message;
            }
          });
        }
      }
    }

    setErrors(newErrors);
    setIsValidating(false);

    const isValid = Object.keys(newErrors).length === 0;

    if (isValid) {
      try {
        await onSuccess?.(data);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao processar formulário",
          variant: "destructive"
        });
        return false;
      }
    } else {
      onError?.(newErrors);
    }

    return isValid;
  }, [schema, validateField, onSuccess, onError, toast]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: message
    }));
  }, []);

  return {
    errors,
    isValidating,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    setFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
}

// Common validation schemas
export const commonSchemas = {
  pin: z.string()
    .length(4, 'PIN deve ter exatamente 4 dígitos')
    .regex(/^\d{4}$/, 'PIN deve conter apenas números')
    .refine(
      (pin) => !['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'].includes(pin),
      'PIN muito simples. Use uma combinação mais segura.'
    ),
  
  imei: z.string()
    .min(15, 'IMEI deve ter pelo menos 15 dígitos')
    .max(17, 'IMEI deve ter no máximo 17 caracteres')
    .regex(/^\d+$/, 'IMEI deve conter apenas números'),
  
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .regex(/^[\d\s\-\(\)\+]+$/, 'Formato de telefone inválido'),
  
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
};