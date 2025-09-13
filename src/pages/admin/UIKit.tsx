import { useState } from "react";
import { ArrowLeft, Copy, Eye, Code, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { BatteryIndicator } from "@/components/BatteryIndicator";
import { StatsCard } from "@/components/ui/stats-card";
import { ItemCard } from "@/components/ItemCard";

interface UIKitProps {
  onBack: () => void;
}

export const UIKit = ({ onBack }: UIKitProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O código do exemplo foi copiado para a área de transferência.",
    });
  };

  const categories = [
    { id: "all", name: "Todos", count: 15 },
    { id: "inputs", name: "Inputs", count: 5 },
    { id: "buttons", name: "Botões", count: 3 },
    { id: "display", name: "Display", count: 4 },
    { id: "feedback", name: "Feedback", count: 3 },
    { id: "overlays", name: "Overlays", count: 4 },
    { id: "data", name: "Dados", count: 2 },
    { id: "domain", name: "Domínio", count: 3 }
  ];

  const components = [
    // Buttons
    {
      id: "button",
      name: "Button",
      category: "buttons",
      description: "Botão interativo com múltiplas variantes",
      tokens: ["--primary", "--primary-foreground", "--border-radius"],
      example: (
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      ),
      code: `<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Destructive</Button>`
    },
    // Inputs
    {
      id: "input",
      name: "Input",
      category: "inputs",
      description: "Campo de entrada de texto",
      tokens: ["--input", "--ring", "--border", "--border-radius"],
      example: (
        <div className="space-y-2 w-full max-w-sm">
          <Input placeholder="Email" />
          <Input placeholder="Senha" type="password" />
          <Input placeholder="Desabilitado" disabled />
        </div>
      ),
      code: `<Input placeholder="Email" />
<Input placeholder="Senha" type="password" />
<Input placeholder="Desabilitado" disabled />`
    },
    {
      id: "select",
      name: "Select",
      category: "inputs",
      description: "Seletor dropdown com opções",
      tokens: ["--popover", "--border", "--border-radius"],
      example: (
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opcao1">Opção 1</SelectItem>
            <SelectItem value="opcao2">Opção 2</SelectItem>
            <SelectItem value="opcao3">Opção 3</SelectItem>
          </SelectContent>
        </Select>
      ),
      code: `<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Selecione uma opção" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opcao1">Opção 1</SelectItem>
  </SelectContent>
</Select>`
    },
    {
      id: "checkbox",
      name: "Checkbox",
      category: "inputs",
      description: "Caixa de seleção múltipla",
      tokens: ["--primary", "--border", "--border-radius"],
      example: (
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms">Aceitar termos e condições</Label>
        </div>
      ),
      code: `<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Aceitar termos</Label>
</div>`
    },
    {
      id: "switch",
      name: "Switch",
      category: "inputs",
      description: "Interruptor de ligado/desligado",
      tokens: ["--primary", "--border-radius"],
      example: (
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" />
          <Label htmlFor="airplane-mode">Modo avião</Label>
        </div>
      ),
      code: `<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Modo avião</Label>
</div>`
    },
    // Display
    {
      id: "badge",
      name: "Badge",
      category: "display",
      description: "Marcador de status ou categoria",
      tokens: ["--primary", "--secondary", "--destructive", "--border-radius"],
      example: (
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      ),
      code: `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`
    },
    {
      id: "card",
      name: "Card",
      category: "display",
      description: "Container para agrupar conteúdo relacionado",
      tokens: ["--card", "--card-foreground", "--border", "--border-radius"],
      example: (
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Descrição do card aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Conteúdo do card.</p>
          </CardContent>
        </Card>
      ),
      code: `<Card className="w-[350px]">
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição do card.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Conteúdo do card.</p>
  </CardContent>
</Card>`
    },
    {
      id: "progress",
      name: "Progress",
      category: "display",
      description: "Barra de progresso",
      tokens: ["--primary", "--secondary", "--border-radius"],
      example: (
        <div className="w-full space-y-2">
          <Progress value={33} className="w-[60%]" />
          <Progress value={66} className="w-[60%]" />
          <Progress value={100} className="w-[60%]" />
        </div>
      ),
      code: `<Progress value={33} className="w-[60%]" />
<Progress value={66} className="w-[60%]" />
<Progress value={100} className="w-[60%]" />`
    },
    // Feedback
    {
      id: "alert",
      name: "Alert",
      category: "feedback",
      description: "Mensagem de alerta ou informação",
      tokens: ["--destructive", "--border", "--border-radius"],
      example: (
        <Alert>
          <AlertTitle>Atenção!</AlertTitle>
          <AlertDescription>
            Esta é uma mensagem de alerta importante.
          </AlertDescription>
        </Alert>
      ),
      code: `<Alert>
  <AlertTitle>Atenção!</AlertTitle>
  <AlertDescription>
    Esta é uma mensagem de alerta importante.
  </AlertDescription>
</Alert>`
    },
    {
      id: "skeleton",
      name: "Skeleton",
      category: "feedback",
      description: "Placeholder para conteúdo carregando",
      tokens: ["--muted", "--border-radius"],
      example: (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ),
      code: `<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
</div>`
    },
    // Domain Components
    {
      id: "battery-indicator",
      name: "BatteryIndicator",
      category: "domain",
      description: "Indicador visual de bateria do aparelho",
      tokens: ["--success", "--warning", "--destructive"],
      example: (
        <div className="flex flex-wrap gap-4">
          <BatteryIndicator battery={85} />
          <BatteryIndicator battery={50} />
          <BatteryIndicator battery={15} />
          <BatteryIndicator battery={0} />
        </div>
      ),
      code: `<BatteryIndicator battery={85} />
<BatteryIndicator battery={50} />
<BatteryIndicator battery={15} />
<BatteryIndicator battery={0} />`
    },
    {
      id: "stats-card",
      name: "StatsCard",
      category: "domain",
      description: "Card para exibir estatísticas",
      tokens: ["--card", "--primary", "--muted-foreground"],
      example: (
        <StatsCard
          title="Total de Aparelhos"
          value="1,234"
        />
      ),
      code: `<StatsCard
  title="Total de Aparelhos"
  value="1,234"
/>`
    }
  ];

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || component.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">UI Kit</h1>
          <p className="text-muted-foreground">
            Catálogo de componentes com exemplos e código
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Buscar componentes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Components Grid */}
      <div className="grid gap-6">
        {filteredComponents.map((component) => (
          <Card key={component.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    {component.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {component.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {categories.find(c => c.id === component.category)?.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Código
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="mt-4">
                  <div className="p-6 border border-border rounded-lg bg-background min-h-[120px] flex items-center justify-center">
                    {component.example}
                  </div>
                </TabsContent>
                
                <TabsContent value="code" className="mt-4">
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                      <code>{component.code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(component.code)}
                      className="absolute top-2 right-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Design Tokens */}
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Tokens de Design</h4>
                <div className="flex flex-wrap gap-1">
                  {component.tokens.map((token) => (
                    <Badge key={token} variant="secondary" className="text-xs font-mono">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum componente encontrado para "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};