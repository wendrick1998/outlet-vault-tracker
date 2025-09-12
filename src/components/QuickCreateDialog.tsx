import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useBrandMutations,
  useColorMutations,
  useStorageMutations,
} from "@/hooks/useCatalogs";

const brandSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

const colorSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

const storageSchema = z.object({
  size_gb: z.number().min(1, "Tamanho é obrigatório"),
  display_name: z.string().min(1, "Nome de exibição é obrigatório"),
});

interface QuickCreateDialogProps {
  type: 'brand' | 'color' | 'storage';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}

export const QuickCreateDialog = ({ type, open, onOpenChange, onCreated }: QuickCreateDialogProps) => {
  const { createBrand } = useBrandMutations();
  const { createColor } = useColorMutations();
  const { createStorage } = useStorageMutations();

  const getSchema = () => {
    switch (type) {
      case 'brand': return brandSchema;
      case 'color': return colorSchema;
      case 'storage': return storageSchema;
      default: return brandSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: type === 'storage' ? { size_gb: 64, display_name: '64GB' } : { name: '' },
  });

  const handleSubmit = async (data: any) => {
    try {
      let result;
      
      switch (type) {
        case 'brand':
          result = await createBrand.mutateAsync(data);
          break;
        case 'color':
          result = await createColor.mutateAsync(data);
          break;
        case 'storage':
          result = await createStorage.mutateAsync(data);
          break;
      }
      
      if (result) {
        onCreated(result.id);
        form.reset();
      }
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'brand': return 'Criar Nova Marca';
      case 'color': return 'Criar Nova Cor';
      case 'storage': return 'Criar Novo Armazenamento';
      default: return 'Criar Item';
    }
  };

  const isLoading = createBrand.isPending || createColor.isPending || createStorage.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {type === 'storage' ? (
              <>
                <FormField
                  control={form.control}
                  name="size_gb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho (GB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            field.onChange(value);
                            form.setValue('display_name', value >= 1024 ? `${value/1024}TB` : `${value}GB`);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Exibição</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: 128GB, 1TB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          type === 'brand' ? 'ex: Apple, Samsung' : 'ex: Preto, Branco'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};