/**
 * @deprecated
 * Este componente foi substituído por AddDeviceFlow.tsx
 * Mantido apenas para compatibilidade temporária.
 * Use AddDeviceFlow para novos desenvolvimentos.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Smartphone, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUnifiedInventory } from "@/hooks/useUnifiedInventory";
import { validateIMEI } from "@/lib/inventory-import-utils";

const unifiedDeviceSchema = z.object({
  imei: z.string().min(1, "IMEI é obrigatório").refine(validateIMEI, "IMEI inválido (15 dígitos)"),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  color: z.string().optional(),
  storage: z.string().optional(),
  condition: z.string().default("novo"),
  battery_pct: z.coerce.number().min(0).max(100).default(100),
  price: z.coerce.number().optional().nullable(),
  cost: z.coerce.number().optional().nullable(),
  location: z.enum(["vitrine", "estoque", "assistencia", "deposito", "loja_online", "conserto"]).default("estoque"),
  notes: z.string().optional(),
});

type UnifiedDeviceFormData = z.infer<typeof unifiedDeviceSchema>;

interface UnifiedDeviceDialogProps {
  onDeviceAdded?: () => void;
}

export const UnifiedDeviceDialog = ({ onDeviceAdded }: UnifiedDeviceDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createLinkedItem, isCreating } = useUnifiedInventory();

  const form = useForm<UnifiedDeviceFormData>({
    resolver: zodResolver(unifiedDeviceSchema),
    defaultValues: {
      brand: "Apple",
      condition: "novo",
      battery_pct: 100,
      location: "estoque",
    },
  });

  const handleSubmit = async (data: UnifiedDeviceFormData) => {
    try {
      await createLinkedItem.mutateAsync({
        imei: data.imei,
        model: data.model,
        brand: data.brand,
        color: data.color,
        storage: data.storage,
        condition: data.condition,
        battery_pct: data.battery_pct,
        price: data.price,
        cost: data.cost,
        location: data.location,
        notes: data.notes,
      });

      setOpen(false);
      form.reset();
      onDeviceAdded?.();
    } catch (error) {
      console.error("Error creating linked device:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Link2 className="h-4 w-4" />
          Cadastro Integrado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Cadastro Integrado de Aparelho
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="gap-1">
              <Link2 className="h-3 w-3" />
              Inventário + Estoque
            </Badge>
            <span className="text-sm">
              Cadastra o aparelho em ambos os sistemas simultaneamente
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="imei"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMEI *</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <FormControl>
                        <Input placeholder="Apple, Samsung, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input placeholder="iPhone 15 Pro Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <Input placeholder="Azul Titânio, Preto, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Armazenamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="64GB">64GB</SelectItem>
                          <SelectItem value="128GB">128GB</SelectItem>
                          <SelectItem value="256GB">256GB</SelectItem>
                          <SelectItem value="512GB">512GB</SelectItem>
                          <SelectItem value="1TB">1TB</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="seminovo">Seminovo</SelectItem>
                          <SelectItem value="usado">Usado</SelectItem>
                          <SelectItem value="recondicionado">Recondicionado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="battery_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bateria (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Informações de Estoque */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Informações de Estoque</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vitrine">Vitrine</SelectItem>
                          <SelectItem value="estoque">Estoque</SelectItem>
                          <SelectItem value="assistencia">Assistência</SelectItem>
                          <SelectItem value="deposito">Depósito</SelectItem>
                          <SelectItem value="loja_online">Loja Online</SelectItem>
                          <SelectItem value="conserto">Conserto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Valor de compra</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>Valor de venda</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o aparelho..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Cadastrando..." : "Cadastrar em Ambos os Sistemas"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
