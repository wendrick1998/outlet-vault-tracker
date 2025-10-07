import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AppleModelMatcher } from "./AppleModelMatcher";
import { useDebounce } from "@/hooks/useDebounce";

const tradeInSchema = z.object({
  imei: z.string().length(15, "IMEI deve ter 15 dígitos"),
  model: z.string().min(1, "Modelo é obrigatório"),
  color: z.string().optional(),
  battery_pct: z.number().min(0).max(100).default(80),
  notes: z.string().optional(),
});

type TradeInFormData = z.infer<typeof tradeInSchema>;

interface TradeInQuickFormProps {
  soldLoanId: string;
  soldItemModel: string;
  onTradeAdded: (data: any) => void;
  onSkip: () => void;
}

export function TradeInQuickForm({
  soldLoanId,
  soldItemModel,
  onTradeAdded,
  onSkip,
}: TradeInQuickFormProps) {
  const [showRecognizer, setShowRecognizer] = useState(false);
  const [isDuplicateIMEI, setIsDuplicateIMEI] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState<{
    source: string;
    model: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm<TradeInFormData>({
    resolver: zodResolver(tradeInSchema),
    defaultValues: {
      battery_pct: 80,
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

  const onSubmit = async (data: TradeInFormData) => {
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
        p_brand: "Apple", // Fixo para trocas
        p_color: data.color || null,
        p_condition: "usado", // Sempre usado para trocas
        p_battery_pct: data.battery_pct,
        p_location: "estoque",
        p_notes: `Troca referente à venda ${soldLoanId}${
          data.notes ? ` - ${data.notes}` : ""
        }`,
        p_batch_id: null,
        p_supplier_name: null,
      });

      if (error) throw error;

      const resultData = result as any;
      if (!resultData?.success) {
        throw new Error(resultData?.error || "Erro ao criar item de troca");
      }

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["inventory"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["stock"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["unified-inventory"] });

      toast({
        title: "✅ Troca registrada!",
        description: `${data.model} adicionado ao estoque`,
      });

      onTradeAdded(resultData);
    } catch (error: any) {
      console.error("Error creating trade-in:", error);
      toast({
        title: "Erro ao registrar troca",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onSkip()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🔄 Registrar Troca</DialogTitle>
          <DialogDescription>
            Aparelho vendido: <strong>{soldItemModel}</strong>
            <br />
            Preencha os dados do aparelho recebido na troca
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campos pré-preenchidos (readonly) */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-md">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Marca</Label>
              <Badge variant="secondary">Apple</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Condição</Label>
              <Badge variant="secondary">Usado</Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Localização</Label>
              <Badge variant="secondary">Estoque</Badge>
            </div>
          </div>

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

          {/* AppleModelMatcher */}
          {showRecognizer && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">Reconhecer Modelo Apple</h4>
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
                  if (result.color) {
                    form.setValue("color", result.color);
                  }
                  toast({
                    title: "✅ Modelo reconhecido!",
                    description: `${result.model} detectado`,
                  });
                }}
              />
            </div>
          )}

          {/* Cor */}
          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Input
              id="color"
              {...form.register("color")}
              placeholder="Ex: Grafite"
            />
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
              placeholder="Informações adicionais sobre o aparelho..."
              rows={3}
            />
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              Pular Troca
            </Button>
            <Button type="submit" disabled={isSubmitting || isDuplicateIMEI}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Troca
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
