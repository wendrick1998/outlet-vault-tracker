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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useStock } from "@/hooks/useStock";
import { AppleModelMatcher } from "@/components/AppleModelMatcher";
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];

const stockItemSchema = z.object({
  imei: z.string().min(1, "IMEI é obrigatório"),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  color: z.string().optional(),
  storage: z.string().optional(),
  condition: z.string().default("novo"),
  battery_pct: z.coerce.number().min(0).max(100).default(100),
  price: z.coerce.number().optional().nullable(),
  cost: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["disponivel", "reservado", "vendido", "defeituoso", "manutencao", "promocao"]).default("disponivel"),
  location: z.enum(["vitrine", "estoque", "assistencia", "deposito", "loja_online", "conserto"]).default("estoque"),
  shelf_position: z.string().optional(),
  acquisition_date: z.string().optional(),
  warranty_until: z.string().optional(),
  supplier: z.string().optional(),
  purchase_order: z.string().optional(),
  serial_number: z.string().optional(),
  is_featured: z.boolean().default(false),
});

type StockItemFormData = z.infer<typeof stockItemSchema>;

interface StockItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: StockItem | null;
}

export const StockItemDialog = ({ open, onOpenChange, item }: StockItemDialogProps) => {
  const [showAppleMatcher, setShowAppleMatcher] = useState(false);
  const { createItem, updateItem, isCreating, isUpdating } = useStock();

  const form = useForm<StockItemFormData>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      imei: item?.imei || "",
      model: item?.model || "",
      brand: item?.brand || "Apple",
      color: item?.color || "",
      storage: item?.storage || "",
      condition: item?.condition || "novo",
      battery_pct: item?.battery_pct || 100,
      price: item?.price ? Number(item.price) : undefined,
      cost: item?.cost ? Number(item.cost) : undefined,
      notes: item?.notes || "",
      status: (item?.status as any) || "disponivel",
      location: (item?.location as any) || "estoque",
      shelf_position: item?.shelf_position || "",
      acquisition_date: item?.acquisition_date || "",
      warranty_until: item?.warranty_until || "",
      supplier: item?.supplier || "",
      purchase_order: item?.purchase_order || "",
      serial_number: item?.serial_number || "",
      is_featured: item?.is_featured || false,
    },
  });

  const handleSubmit = async (data: StockItemFormData) => {
    try {
      if (item) {
        await updateItem({
          id: item.id,
          data: {
            ...data,
          price: data.price ? data.price.toString() : null,
          cost: data.cost ? data.cost.toString() : null,
            acquisition_date: data.acquisition_date || null,
            warranty_until: data.warranty_until || null,
          },
        });
      } else {
        await createItem({
          ...data,
            price: data.price ? data.price.toString() : null,
            cost: data.cost ? data.cost.toString() : null,
          acquisition_date: data.acquisition_date || null,
          warranty_until: data.warranty_until || null,
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleAppleModelDetected = (result: {
    brand: string;
    model: string;
    storage?: number;
    color?: string;
  }) => {
    form.setValue("brand", result.brand);
    form.setValue("model", result.model);
    if (result.storage) {
      form.setValue("storage", `${result.storage}GB`);
    }
    if (result.color) {
      form.setValue("color", result.color);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Novo Item do Estoque"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Apple Model Recognition */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAppleMatcher(!showAppleMatcher)}
                >
                  {showAppleMatcher ? "Ocultar" : "Mostrar"} Reconhecimento Apple
                </Button>
              </div>
              
              {showAppleMatcher && (
                <div className="p-4 border rounded-lg bg-muted/20">
                  <AppleModelMatcher />
                </div>
              )}
            </div>

            {/* Basic Information */}
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
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série</FormLabel>
                    <FormControl>
                      <Input placeholder="F2LLD0AAHG19" {...field} />
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
                      <Input placeholder="Apple" {...field} />
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
                      <Input placeholder="iPhone 15 Pro" {...field} />
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
                      <Input placeholder="Azul Titânio" {...field} />
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
                          <SelectValue placeholder="Selecione o armazenamento" />
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
            </div>

            {/* Status and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="reservado">Reservado</SelectItem>
                        <SelectItem value="vendido">Vendido</SelectItem>
                        <SelectItem value="defeituoso">Defeituoso</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="promocao">Promoção</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            {/* Technical Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <FormField
                control={form.control}
                name="shelf_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição na Prateleira</FormLabel>
                    <FormControl>
                      <Input placeholder="A1-B2, VIT-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} placeholder="8999.00" {...field} />
                    </FormControl>
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
                      <Input type="number" step="0.01" min={0} placeholder="7500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de Compra</FormLabel>
                    <FormControl>
                      <Input placeholder="OC-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="acquisition_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Aquisição</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warranty_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantia até</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Features */}
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Item em Destaque</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Destacar este item na vitrine
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o item..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};