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

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Senhas não coincidem",
  path: ["confirm_password"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export const ResetPasswordDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
}: ResetPasswordDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validatePassword, isValidating, lastResult } = usePasswordSecurity();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
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

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke(
        'admin-reset-user-password',
        {
          body: {
            user_id: userId,
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
        title: "Senha resetada com sucesso!",
        description: `A senha de ${userName} foi alterada. O usuário deve trocar a senha no próximo login.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resetar Senha</DialogTitle>
          <DialogDescription>
            Definir nova senha para <strong>{userName}</strong>. 
            O usuário será obrigado a alterar a senha no próximo login.
          </DialogDescription>
        </DialogHeader>

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
                      placeholder="Digite a nova senha"
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
                      placeholder="Confirme a nova senha"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !lastResult?.isValid}
                className="min-w-24"
              >
                {isSubmitting ? "Resetando..." : "Resetar Senha"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};