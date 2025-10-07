import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  parseSupplierText,
  sanitizeSupplierText,
  calculateParseStats,
  isValidIMEI,
  ParsedDevice,
} from "@/lib/batch-import-parser";

const batchFormSchema = z.object({
  supplier_name: z.string().min(1, "Fornecedor é obrigatório"),
  purchase_date: z.string(),
  warranty_months: z.number().min(0).max(24),
  notes: z.string().optional(),
});

type BatchFormData = z.infer<typeof batchFormSchema>;

interface SupplierBatchFormProps {
  onBatchCreated?: (data: any) => void;
  triggerButton?: React.ReactNode;
}

export function SupplierBatchForm({
  onBatchCreated,
  triggerButton,
}: SupplierBatchFormProps) {
  const [open, setOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<"paste" | "manual" | "csv">(
    "paste"
  );
  const [pastedText, setPastedText] = useState("");
  const [parsedDevices, setParsedDevices] = useState<ParsedDevice[]>([]);
  const [duplicateIMEIs, setDuplicateIMEIs] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      purchase_date: new Date().toISOString().split("T")[0],
      warranty_months: 0,
    },
  });

  // Calcular estatísticas do parsing
  const parseStats = useMemo(() => {
    if (parsedDevices.length === 0) return null;
    return calculateParseStats(parsedDevices, duplicateIMEIs);
  }, [parsedDevices, duplicateIMEIs]);

  // Handler para parsing de texto colado
  const handleParsePastedText = async () => {
    if (!pastedText.trim()) {
      toast({
        title: "Campo vazio",
        description: "Cole o texto da nota do fornecedor",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const sanitized = sanitizeSupplierText(pastedText);
      const defaultWarranty = form.getValues("warranty_months");
      const devices = parseSupplierText(sanitized, defaultWarranty);

      if (devices.length === 0) {
        toast({
          title: "Nenhum aparelho detectado",
          description:
            "Verifique o formato do texto. Deve conter modelo e IMEI.",
          variant: "destructive",
        });
        return;
      }

      // Validar IMEIs duplicados no banco
      const imeis = devices.map((d) => d.imei);
      const { data: existingDevices } = await supabase
        .from("unified_inventory")
        .select("imei")
        .in("imei", imeis);

      const duplicates = new Set(
        existingDevices?.map((d) => d.imei) || []
      );
      setDuplicateIMEIs(duplicates);

      setParsedDevices(devices);
      toast({
        title: "✅ Texto processado!",
        description: `${devices.length} aparelhos detectados`,
      });
    } catch (error) {
      console.error("Error parsing text:", error);
      toast({
        title: "Erro ao processar texto",
        description: "Verifique o formato e tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler para remover item da lista
  const handleRemoveDevice = (index: number) => {
    setParsedDevices((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler para submissão do lote
  const onSubmit = async (data: BatchFormData) => {
    if (parsedDevices.length === 0) {
      toast({
        title: "Nenhum aparelho na lista",
        description: "Adicione aparelhos antes de continuar",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há duplicados
    if (duplicateIMEIs.size > 0) {
      const duplicateCount = parsedDevices.filter((d) =>
        duplicateIMEIs.has(d.imei)
      ).length;
      toast({
        title: "IMEIs duplicados encontrados",
        description: `${duplicateCount} aparelhos já estão cadastrados. Remova-os antes de continuar.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Criar batch no banco
      const { data: batch, error: batchError } = await supabase
        .from("supplier_batches")
        .insert({
          supplier_name: data.supplier_name,
          purchase_date: data.purchase_date,
          warranty_months: data.warranty_months,
          total_items: parsedDevices.length,
          total_cost: parsedDevices.reduce((sum, d) => sum + (d.cost || 0), 0),
          notes: data.notes,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // 2. Criar cada item vinculado ao batch
      const results = await Promise.allSettled(
        parsedDevices.map((device) =>
          supabase.rpc("create_linked_item", {
            p_imei: device.imei,
            p_model: device.model,
            p_brand: "Apple",
            p_color: device.color || null,
            p_storage: device.storage || null,
            p_condition: device.condition,
            p_battery_pct: device.battery_pct,
            p_cost: device.cost || null,
            p_location: "estoque",
            p_notes: null,
            p_batch_id: batch.id,
            p_supplier_name: data.supplier_name,
          })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["inventory"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["stock"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["unified-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-batches"] });

      toast({
        title: "✅ Lote importado!",
        description: `${successful} aparelhos adicionados com sucesso.${
          failed > 0 ? ` ${failed} falharam.` : ""
        }`,
      });

      onBatchCreated?.({ batch, successful, failed });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating batch:", error);
      toast({
        title: "Erro ao importar lote",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setPastedText("");
    setParsedDevices([]);
    setDuplicateIMEIs(new Set());
    setInputMethod("paste");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Lote
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Lote de Fornecedor</DialogTitle>
          <DialogDescription>
            Adicione múltiplos aparelhos de uma vez colando a nota do fornecedor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados do Lote */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-medium">Dados do Lote</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_name">Fornecedor *</Label>
                  <Input
                    id="supplier_name"
                    {...form.register("supplier_name")}
                    placeholder="Nome do fornecedor"
                  />
                  {form.formState.errors.supplier_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.supplier_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Data de Compra</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    {...form.register("purchase_date")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warranty_months">Garantia Padrão</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Notas adicionais..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Método de Entrada */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-medium">Método de Entrada</h3>

              <RadioGroup
                value={inputMethod}
                onValueChange={(value: any) => setInputMethod(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paste" id="paste" />
                  <Label htmlFor="paste" className="cursor-pointer">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Colar Lista
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" disabled />
                  <Label
                    htmlFor="manual"
                    className="cursor-not-allowed opacity-50"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Adicionar Manual (em breve)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" disabled />
                  <Label htmlFor="csv" className="cursor-not-allowed opacity-50">
                    <Upload className="h-4 w-4 inline mr-1" />
                    Importar CSV/XLSX (em breve)
                  </Label>
                </div>
              </RadioGroup>

              {/* Input de Texto Colado */}
              {inputMethod === "paste" && (
                <div className="space-y-3">
                  <Label>Cole o texto da nota do fornecedor</Label>
                  <Textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Exemplo:
iPhone 13 Pro 128G grafite SEMINOVO (100%) 
Qtd: 1
Garantia: 3 meses
IMEI 1: 0359984989957537
R$ 2.150,00

iPhone 12 128G roxo SEMINOVO (100%) 
Qtd: 1
Garantia: 3 meses
IMEI 1: 353253182116697
R$ 1.240,00`}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleParsePastedText}
                    disabled={isProcessing || !pastedText.trim()}
                  >
                    {isProcessing && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Processar Texto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview de Itens Detectados */}
          {parsedDevices.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    Aparelhos Detectados ({parsedDevices.length})
                  </h3>
                  {parseStats && (
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {parseStats.valid} válidos
                      </Badge>
                      {parseStats.duplicates > 0 && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {parseStats.duplicates} duplicados
                        </Badge>
                      )}
                      {parseStats.totalCost > 0 && (
                        <Badge variant="outline">
                          Total: R$ {parseStats.totalCost.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[300px] border rounded-md p-4">
                  <div className="space-y-3">
                    {parsedDevices.map((device, index) => {
                      const isDuplicate = duplicateIMEIs.has(device.imei);
                      const isInvalid = !isValidIMEI(device.imei);

                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-3 p-3 rounded-md ${
                            isDuplicate || isInvalid
                              ? "bg-destructive/10 border border-destructive"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{device.model}</div>
                            <div className="text-sm text-muted-foreground">
                              IMEI: {device.imei}
                              {device.storage && ` • ${device.storage}`}
                              {device.color && ` • ${device.color}`}
                              {device.cost && ` • R$ ${device.cost.toFixed(2)}`}
                            </div>
                          </div>
                          <Badge variant="outline">{device.condition}</Badge>
                          <Badge variant="outline">{device.battery_pct}%</Badge>
                          {isDuplicate && (
                            <Badge variant="destructive">Duplicado</Badge>
                          )}
                          {isInvalid && (
                            <Badge variant="destructive">IMEI Inválido</Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDevice(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {duplicateIMEIs.size > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Alguns IMEIs já estão cadastrados no sistema. Remova os
                      itens duplicados antes de continuar.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                parsedDevices.length === 0 ||
                duplicateIMEIs.size > 0
              }
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Importar {parsedDevices.length} Aparelhos
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
