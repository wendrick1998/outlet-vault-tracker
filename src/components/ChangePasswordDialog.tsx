import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { PasswordSecurityFeedback } from '@/components/ui/password-security-feedback';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const changePasswordSchema = z.object({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isMandatory?: boolean;
}

export const ChangePasswordDialog = ({
  open,
  onOpenChange,
  onSuccess,
  isMandatory = false,
}: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validatePassword, isValidating, lastResult } = usePasswordSecurity();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const password = form.watch("password");

  React.useEffect(() => {
    if (password && password.length >= 8) {
      validatePassword(password);
    }
  }, [password, validatePassword]);

  const handleSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'user-change-password',
        {
          body: {
            new_password: data.password,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada.",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isMandatory ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={isMandatory ? (e) => e.preventDefault() : undefined}>
        <DialogHeader>
          <DialogTitle>
            {isMandatory ? "Alterar Senha Obrigatória" : "Alterar Senha"}
          </DialogTitle>
          <DialogDescription>
            {isMandatory 
              ? "Você deve alterar sua senha antes de continuar usando o sistema."
              : "Defina uma nova senha para sua conta."
            }
          </DialogDescription>
        </DialogHeader>

        {isMandatory && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta é uma alteração obrigatória. Você não pode prosseguir sem definir uma nova senha.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Digite sua nova senha"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PasswordSecurityFeedback 
              result={lastResult} 
              isLoading={isValidating}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Confirme sua nova senha"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              {!isMandatory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !lastResult?.isValid}
                className="min-w-24"
              >
                {isSubmitting ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};