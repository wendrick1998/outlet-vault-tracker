import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Plus, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppleModelMatcher } from "./AppleModelMatcher";
import { useDebounce } from "@/hooks/useDebounce";

const unifiedDeviceSchema = z.object({
  // Campos comuns
  imei: z.string().length(15, "IMEI deve ter 15 dígitos"),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
  color: z.string().optional(),
  storage: z.string().optional(),
  condition: z.string().min(1, "Condição é obrigatória"),
  battery_pct: z.number().min(0).max(100),
  location: z.enum(["estoque", "vitrine", "assistencia", "deposito"])
    .refine((val) => val, { message: "Localização é obrigatória" }),
  notes: z.string().optional(),
  
  // Campos exclusivos de compra
  supplier_name: z.string().optional(),
  cost: z.number().optional(),
  price: z.number().optional(),
  purchase_date: z.string().optional(),
  warranty_months: z.number().optional(),
});

type UnifiedDeviceFormData = z.infer<typeof unifiedDeviceSchema>;

interface AddDeviceFlowProps {
  defaultOrigin?: "trade" | "purchase";
  onDeviceAdded?: (data: any) => void;
  triggerButton?: React.ReactNode;
}

export function AddDeviceFlow({
  defaultOrigin = "trade",
  onDeviceAdded,
  triggerButton,
}: AddDeviceFlowProps) {
  const [open, setOpen] = useState(false);
  const [originType, setOriginType] = useState<"trade" | "purchase">(defaultOrigin);
  const [showRecognizer, setShowRecognizer] = useState(false);
  const [isDuplicateIMEI, setIsDuplicateIMEI] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState<{
    source: string;
    model: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm<UnifiedDeviceFormData>({
    resolver: zodResolver(unifiedDeviceSchema),
    defaultValues: {
      brand: "Apple",
      condition: "usado",
      battery_pct: 100,
      location: "estoque",
      warranty_months: 0,
      purchase_date: new Date().toISOString().split("T")[0],
    },
  });

  // Validação de IMEI em tempo real
  const checkDuplicateRaw = async (imei: string) => {
    if (imei.length < 15) return;

    const { data } = await supabase
      .from("unified_inventory")
      .select("imei, model, source")
      .eq("imei", imei)
      .maybeSingle();

    if (data) {
      setIsDuplicateIMEI(true);
      setDuplicateDetails({
        source: data.source || "sistema",
        model: data.model || "desconhecido",
      });
    } else {
      setIsDuplicateIMEI(false);
      setDuplicateDetails(null);
    }
  };

  const checkDuplicate = useDebounce(checkDuplicateRaw, 500);

  const watchedIMEI = form.watch("imei");

  useEffect(() => {
    if (watchedIMEI) {
      checkDuplicate(watchedIMEI);
    }
  }, [watchedIMEI, checkDuplicate]);

  const onSubmit = async (data: UnifiedDeviceFormData) => {
    if (isDuplicateIMEI) {
      toast({
        title: "IMEI duplicado",
        description: "Este IMEI já está cadastrado no sistema",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.rpc("create_linked_item", {
        p_imei: data.imei,
        p_model: data.model,
        p_brand: data.brand,
        p_color: data.color || null,
        p_storage: data.storage || null,
        p_condition: data.condition,
        p_battery_pct: data.battery_pct,
        p_price: data.price || null,
        p_cost: data.cost || null,
        p_location: data.location,
        p_notes: data.notes || null,
        p_batch_id: null,
        p_supplier_name: data.supplier_name || null,
      });

      if (error) throw error;

      const resultData = result as any;
      if (!resultData?.success) {
        throw new Error(resultData?.error || "Erro ao criar item");
      }

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["inventory"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["stock"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["unified-inventory"] });

      toast({
        title: "✅ Aparelho cadastrado!",
        description: `${data.model} adicionado ao sistema com sucesso.`,
      });

      onDeviceAdded?.(resultData);
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error creating device:", error);
      toast({
        title: "Erro ao cadastrar aparelho",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Aparelho
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Aparelho</DialogTitle>
          <DialogDescription>
            Preencha os dados do aparelho para adicionar ao sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seleção de origem */}
          <div className="space-y-2">
            <Label>Origem do Aparelho</Label>
            <RadioGroup
              value={originType}
              onValueChange={(value) => setOriginType(value as "trade" | "purchase")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trade" id="trade" />
                <Label htmlFor="trade" className="cursor-pointer">
                  Troca de Cliente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="purchase" id="purchase" />
                <Label htmlFor="purchase" className="cursor-pointer">
                  Compra de Fornecedor
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* CAMPOS COMUNS */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Informações do Aparelho</h3>

            {/* IMEI */}
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI *</Label>
              <Input
                id="imei"
                {...form.register("imei")}
                placeholder="Digite o IMEI (15 dígitos)"
                maxLength={15}
                className={isDuplicateIMEI ? "border-destructive" : ""}
              />
              {form.formState.errors.imei && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.imei.message}
                </p>
              )}
              {isDuplicateIMEI && duplicateDetails && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    IMEI já cadastrado: {duplicateDetails.model} (
                    {duplicateDetails.source})
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Modelo com reconhecimento */}
            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <div className="flex gap-2">
                <Input
                  id="model"
                  {...form.register("model")}
                  placeholder="Ex: iPhone 13 Pro"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRecognizer(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Reconhecer
                </Button>
              </div>
              {form.formState.errors.model && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.model.message}
                </p>
              )}
            </div>

            {/* AppleModelMatcher com integração */}
            {showRecognizer && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Reconhecer Modelo Apple</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecognizer(false)}
                  >
                    Fechar
                  </Button>
                </div>
                <AppleModelMatcher
                  onMatch={(result) => {
                    form.setValue("model", result.model);
                    if (result.storage) {
                      form.setValue("storage", `${result.storage}GB`);
                    }
                    if (result.color) {
                      form.setValue("color", result.color);
                    }
                    toast({
                      title: "✅ Modelo reconhecido!",
                      description: `${result.model} detectado com ${Math.round(result.confidence * 100)}% de confiança`,
                    });
                  }}
                />
              </div>
            )}

            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                {...form.register("brand")}
                placeholder="Ex: Apple"
              />
              {form.formState.errors.brand && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.brand.message}
                </p>
              )}
            </div>

            {/* Cor e Armazenamento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  {...form.register("color")}
                  placeholder="Ex: Grafite"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage">Armazenamento</Label>
                <Select
                  value={form.watch("storage")}
                  onValueChange={(value) => form.setValue("storage", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="64GB">64GB</SelectItem>
                    <SelectItem value="128GB">128GB</SelectItem>
                    <SelectItem value="256GB">256GB</SelectItem>
                    <SelectItem value="512GB">512GB</SelectItem>
                    <SelectItem value="1TB">1TB</SelectItem>
                    <SelectItem value="2TB">2TB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Condição e Localização */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition">Condição *</Label>
                <Select
                  value={form.watch("condition")}
                  onValueChange={(value) => form.setValue("condition", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="seminovo">Seminovo</SelectItem>
                    <SelectItem value="usado">Usado</SelectItem>
                    <SelectItem value="recondicionado">Recondicionado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização *</Label>
                <Select
                  value={form.watch("location")}
                  onValueChange={(value: any) => form.setValue("location", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estoque">Estoque</SelectItem>
                    <SelectItem value="vitrine">Vitrine</SelectItem>
                    <SelectItem value="assistencia">Assistência</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bateria */}
            <div className="space-y-2">
              <Label>Bateria: {form.watch("battery_pct")}%</Label>
              <Slider
                value={[form.watch("battery_pct")]}
                onValueChange={([value]) => form.setValue("battery_pct", value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </div>

          {/* CAMPOS EXCLUSIVOS DE COMPRA */}
          {originType === "purchase" && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Dados da Compra</h3>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Fornecedor *</Label>
                <Input
                  id="supplier_name"
                  {...form.register("supplier_name")}
                  placeholder="Nome do fornecedor"
                />
              </div>

              {/* Custo e Preço */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Custo (R$) *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    {...form.register("cost", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço Sugerido (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...form.register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Data de Compra e Garantia */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Data de Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    {...form.register("purchase_date")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty_months">Garantia (meses)</Label>
                  <Select
                    value={form.watch("warranty_months")?.toString()}
                    onValueChange={(value) =>
                      form.setValue("warranty_months", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem garantia</SelectItem>
                      <SelectItem value="1">1 mês</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isDuplicateIMEI}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar Aparelho
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
