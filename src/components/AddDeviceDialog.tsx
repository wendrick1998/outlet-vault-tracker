import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useBrands, useColors, useStorages, useConditions } from "@/hooks/useCatalogs";
import { useDevicesAdmin } from "@/hooks/useDevicesAdmin";
import { validateIMEI } from "@/lib/inventory-import-utils";
import { QuickCreateDialog } from "./QuickCreateDialog";

const deviceSchema = z.object({
  brand_id: z.string().min(1, "Marca é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  variant: z.string().optional(),
  storage_id: z.string().min(1, "Armazenamento é obrigatório"),
  color_id: z.string().min(1, "Cor é obrigatória"),
  condition_id: z.string().min(1, "Condição é obrigatória"),
  battery_pct: z.number().min(0, "Bateria deve ser entre 0 e 100").max(100, "Bateria deve ser entre 0 e 100").nullable().optional(),
  imei: z.string().min(1, "IMEI é obrigatório").refine(validateIMEI, "IMEI inválido"),
  imei2: z.string().optional(),
  serial: z.string().optional(),
  notes: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface AddDeviceDialogProps {
  onDeviceAdded?: () => void;
}

export const AddDeviceDialog = ({ onDeviceAdded }: AddDeviceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState<'brand' | 'color' | 'storage' | null>(null);

  const { data: brands = [] } = useBrands();
  const { data: colors = [] } = useColors();
  const { data: storages = [] } = useStorages();
  const { data: conditions = [] } = useConditions();
  const { createDevice, isCreating } = useDevicesAdmin();

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      battery_pct: undefined,
    },
  });

  const handleSubmit = async (data: DeviceFormData) => {
    try {
      // Get related data for display
      const brand = brands.find(b => b.id === data.brand_id);
      const color = colors.find(c => c.id === data.color_id);
      const storage = storages.find(s => s.id === data.storage_id);
      const condition = conditions.find(c => c.id === data.condition_id);

      const deviceData = {
        // Keep legacy fields for compatibility
        brand: brand?.name || '',
        model: data.model,
        color: color?.name || '',
        storage: storage?.display_name || '',
        condition: condition?.label || '',
        imei: data.imei,
        suffix: data.imei2 || null,
        notes: data.notes || null,
        battery_pct: data.battery_pct || null,
        // New FK references
        brand_id: data.brand_id,
        color_id: data.color_id,
        storage_id: data.storage_id,
        condition_id: data.condition_id,
      };

      await createDevice.mutateAsync(deviceData);
      
      setOpen(false);
      form.reset();
      onDeviceAdded?.();
      
      toast({
        title: "Aparelho adicionado com sucesso!",
        description: `${brand?.name} ${data.model} foi cadastrado no inventário.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar aparelho",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getBatteryColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Aparelho
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Adicionar Novo Aparelho
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand */}
                <FormField
                  control={form.control}
                  name="brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                            <SelectContent>
                              {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickCreateType('brand')}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Model */}
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: iPhone 14 Pro Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Variant */}
                <FormField
                  control={form.control}
                  name="variant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variante (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Plus, Pro, Mini" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Storage */}
                <FormField
                  control={form.control}
                  name="storage_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Armazenamento</FormLabel>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o armazenamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {storages.map((storage) => (
                                <SelectItem key={storage.id} value={storage.id}>
                                  {storage.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickCreateType('storage')}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color */}
                <FormField
                  control={form.control}
                  name="color_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a cor" />
                            </SelectTrigger>
                            <SelectContent>
                              {colors.map((color) => (
                                <SelectItem key={color.id} value={color.id}>
                                  {color.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickCreateType('color')}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Condition */}
                <FormField
                  control={form.control}
                  name="condition_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a condição" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditions.map((condition) => (
                              <SelectItem key={condition.id} value={condition.id}>
                                {condition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Battery */}
                <FormField
                  control={form.control}
                  name="battery_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Bateria (%) - Opcional
                        {field.value !== undefined && (
                          <span className={getBatteryColor(field.value)}>
                            {field.value}%
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Deixe vazio se não informado"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : parseInt(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* IMEI 1 */}
                <FormField
                  control={form.control}
                  name="imei"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMEI 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Obrigatório - 15 dígitos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* IMEI 2 */}
                <FormField
                  control={form.control}
                  name="imei2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMEI 2 (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Para dual-chip" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Serial */}
                <FormField
                  control={form.control}
                  name="serial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de série" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre o aparelho..."
                        className="min-h-[80px]"
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
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Adicionando..." : "Adicionar Aparelho"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quick Create Dialogs */}
      {quickCreateType && (
        <QuickCreateDialog
          type={quickCreateType}
          open={!!quickCreateType}
          onOpenChange={() => setQuickCreateType(null)}
          onCreated={(id) => {
            if (quickCreateType === 'brand') {
              form.setValue('brand_id', id);
            } else if (quickCreateType === 'color') {
              form.setValue('color_id', id);
            } else if (quickCreateType === 'storage') {
              form.setValue('storage_id', id);
            }
            setQuickCreateType(null);
          }}
        />
      )}
    </>
  );
};
