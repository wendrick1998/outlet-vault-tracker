import React, { useState } from 'react';
import { ArrowLeft, Palette, Component, Eye, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, CheckCircle, XCircle, Battery, Smartphone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface UIKitProps {
  onBack: () => void;
}

const UIKit = ({ onBack }: UIKitProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('buttons');

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const ComponentShowcase = ({ 
    title, 
    description, 
    children, 
    code, 
    id 
  }: { 
    title: string;
    description: string;
    children: React.ReactNode;
    code: string;
    id: string;
  }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Component className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyCode(code, id)}
            className="gap-2"
          >
            {copiedCode === id ? (
              <>
                <Check className="h-4 w-4 text-success" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Código
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  const BatteryIndicator = ({ percentage, className = "" }: { percentage: number; className?: string }) => {
    const getColor = () => {
      if (percentage >= 80) return 'text-success';
      if (percentage >= 50) return 'text-warning';
      return 'text-destructive';
    };

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Battery className={`h-4 w-4 ${getColor()}`} />
        <span className="text-sm font-medium">{percentage}%</span>
      </div>
    );
  };

  const ItemCard = ({ item }: { item: any }) => (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm truncate">{item.model}</h3>
            <Badge variant={item.status === 'available' ? 'default' : 'secondary'}>
              {item.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{item.imei}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{item.storage} • {item.condition}</span>
            <BatteryIndicator percentage={item.battery} />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            UI Kit - Sistema de Design
          </h1>
          <p className="text-muted-foreground">
            Catálogo completo de componentes do Outlet Vault Tracker
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="buttons">Botões</TabsTrigger>
          <TabsTrigger value="forms">Formulários</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="overlays">Overlays</TabsTrigger>
        </TabsList>

        {/* Buttons Tab */}
        <TabsContent value="buttons" className="mt-6">
          <ComponentShowcase
            title="Buttons"
            description="Botões primários, secundários e variantes"
            id="buttons"
            code={`<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>`}
          >
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Badge"
            description="Etiquetas para status e categorização"
            id="badges"
            code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Available</Badge>
              <Badge variant="secondary">Loaned</Badge>
              <Badge variant="destructive">Sold</Badge>
              <Badge variant="outline">Maintenance</Badge>
            </div>
          </ComponentShowcase>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="mt-6">
          <ComponentShowcase
            title="Input Fields"
            description="Campos de entrada de dados"
            id="inputs"
            code={`<Input placeholder="Digite algo..." />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled input" />`}
          >
            <div className="space-y-3 max-w-sm">
              <div>
                <Label htmlFor="input1">Nome do produto</Label>
                <Input id="input1" placeholder="iPhone 13 Pro" />
              </div>
              <div>
                <Label htmlFor="input2">IMEI</Label>
                <Input id="input2" placeholder="000000000000000" />
              </div>
              <div>
                <Label htmlFor="input3">Campo desabilitado</Label>
                <Input id="input3" disabled placeholder="Campo desabilitado" />
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Select & Textarea"
            description="Seleção e área de texto"
            id="select-textarea"
            code={`<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opção 1</SelectItem>
  </SelectContent>
</Select>`}
          >
            <div className="space-y-4 max-w-sm">
              <div>
                <Label>Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="loaned">Emprestado</SelectItem>
                    <SelectItem value="sold">Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" placeholder="Digite suas observações..." />
              </div>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Checkboxes & Radio"
            description="Seleção múltipla e única"
            id="checkboxes-radio"
            code={`<Checkbox id="terms" />
<RadioGroup defaultValue="option-one">
  <RadioGroupItem value="option-one" id="r1" />
  <RadioGroupItem value="option-two" id="r2" />
</RadioGroup>`}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms2" />
                <Label htmlFor="terms2">Aceito os termos e condições</Label>
              </div>
              
              <div>
                <Label className="text-base font-medium">Condição do aparelho:</Label>
                <RadioGroup defaultValue="novo" className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="novo" id="r1" />
                    <Label htmlFor="r1">Novo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="seminovo" id="r2" />
                    <Label htmlFor="r2">Seminovo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="usado" id="r3" />
                    <Label htmlFor="r3">Usado</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="notifications" />
                <Label htmlFor="notifications">Receber notificações</Label>
              </div>
            </div>
          </ComponentShowcase>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="mt-6">
          <ComponentShowcase
            title="Item Card"
            description="Card específico para itens do inventário"
            id="item-card"
            code={`<Card className="p-4">
  <div className="flex items-start gap-3">
    <Smartphone className="h-5 w-5" />
    <div className="flex-1">
      <h3 className="font-semibold">{item.model}</h3>
      <p className="text-muted-foreground">{item.imei}</p>
      <BatteryIndicator percentage={item.battery} />
    </div>
  </div>
</Card>`}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ItemCard item={{
                model: "iPhone 13 Pro",
                imei: "352725355608957",
                storage: "128GB",
                condition: "Seminovo",
                battery: 97,
                status: "available"
              }} />
              <ItemCard item={{
                model: "Samsung Galaxy S22",
                imei: "352725355608958",
                storage: "256GB",
                condition: "Novo",
                battery: 45,
                status: "loaned"
              }} />
              <ItemCard item={{
                model: "iPhone 12",
                imei: "352725355608959",
                storage: "64GB",
                condition: "Usado",
                battery: 23,
                status: "available"
              }} />
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Progress & Sliders"
            description="Indicadores de progresso e controles deslizantes"
            id="progress"
            code={`<Progress value={66} />
<Slider defaultValue={[33]} max={100} step={1} />`}
          >
            <div className="space-y-6">
              <div>
                <Label>Progresso da conferência</Label>
                <Progress value={66} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">66% concluído</p>
              </div>
              
              <div>
                <Label>Filtro de bateria mínima</Label>
                <Slider defaultValue={[30]} max={100} step={1} className="mt-2" />
              </div>
            </div>
          </ComponentShowcase>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="mt-6">
          <ComponentShowcase
            title="Alerts"
            description="Mensagens de alerta e informação"
            id="alerts"
            code={`<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Mensagem de alerta</AlertDescription>
</Alert>`}
          >
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Informação</AlertTitle>
                <AlertDescription>
                  Este é um alerta informativo para o usuário.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                  Ocorreu um erro durante a operação.
                </AlertDescription>
              </Alert>

              <Alert className="border-success text-success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Sucesso</AlertTitle>
                <AlertDescription>
                  Operação realizada com sucesso!
                </AlertDescription>
              </Alert>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Loading States"
            description="Estados de carregamento e esqueletos"
            id="loading"
            code={`<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[200px]" />`}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Loading Card:</h3>
                <Card className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <Button disabled>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Carregando...
                </Button>
              </div>
            </div>
          </ComponentShowcase>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="mt-6">
          <ComponentShowcase
            title="Table"
            description="Tabelas para exibição de dados"
            id="table"
            code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Produto</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>iPhone 13</TableCell>
      <TableCell><Badge>Disponível</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bateria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">iPhone 13 Pro</TableCell>
                  <TableCell>352725355608957</TableCell>
                  <TableCell><Badge variant="default">Disponível</Badge></TableCell>
                  <TableCell><BatteryIndicator percentage={97} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Samsung Galaxy S22</TableCell>
                  <TableCell>352725355608958</TableCell>
                  <TableCell><Badge variant="secondary">Emprestado</Badge></TableCell>
                  <TableCell><BatteryIndicator percentage={45} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ComponentShowcase>

          <ComponentShowcase
            title="Avatar & Profile"
            description="Avatares e informações de perfil"
            id="avatar"
            code={`<Avatar>
  <AvatarImage src="/avatar.jpg" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`}
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>WA</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Wendrick Admin</p>
                <p className="text-sm text-muted-foreground">wendrick@outlook.com</p>
              </div>
            </div>
          </ComponentShowcase>
        </TabsContent>

        {/* Overlays Tab */}
        <TabsContent value="overlays" className="mt-6">
          <ComponentShowcase
            title="Dialog"
            description="Modal dialogs para ações importantes"
            id="dialog"
            code={`<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título do Dialog</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>`}
          >
            <div className="flex gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Abrir Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar novo item</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do novo item do inventário.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Nome do produto</Label>
                      <Input id="name" placeholder="iPhone 13 Pro" />
                    </div>
                    <div>
                      <Label htmlFor="imei">IMEI</Label>
                      <Input id="imei" placeholder="000000000000000" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button>Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Abrir Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtros avançados</SheetTitle>
                    <SheetDescription>
                      Configure os filtros para buscar itens específicos.
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            </div>
          </ComponentShowcase>

          <ComponentShowcase
            title="Popover & Tooltip"
            description="Conteúdo contextual e dicas"
            id="popover-tooltip"
            code={`<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Abrir Popover</Button>
  </PopoverTrigger>
  <PopoverContent>Conteúdo do popover</PopoverContent>
</Popover>`}
          >
            <TooltipProvider>
              <div className="flex gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">Ações rápidas</h4>
                      <p className="text-sm text-muted-foreground">
                        Selecione uma ação para este item.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm">Emprestar</Button>
                        <Button size="sm" variant="outline">Vender</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover para dica</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Esta é uma dica útil para o usuário</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </ComponentShowcase>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UIKit;