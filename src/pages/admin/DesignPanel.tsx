import React, { useState } from 'react';
import { ArrowLeft, Palette, Download, Upload, RotateCcw, Save, Monitor, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useTheme, ThemeTokens } from '@/design/ThemeProvider';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DesignPanelProps {
  onBack: () => void;
}

const ColorPicker = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
}) => {
  const [hue, saturation, lightness] = value.split(' ').map(v => parseFloat(v.replace('%', '')));
  
  const handleHueChange = (newHue: number[]) => {
    onChange(`${newHue[0]} ${saturation}% ${lightness}%`);
  };
  
  const handleSaturationChange = (newSat: number[]) => {
    onChange(`${hue} ${newSat[0]}% ${lightness}%`);
  };
  
  const handleLightnessChange = (newLight: number[]) => {
    onChange(`${hue} ${saturation}% ${newLight[0]}%`);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <div 
            className="w-8 h-8 rounded border-2 border-border" 
            style={{ backgroundColor: `hsl(${value})` }}
          />
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Hue ({Math.round(hue)}°)</Label>
            <Slider
              value={[hue]}
              onValueChange={handleHueChange}
              max={360}
              step={1}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Saturação ({saturation}%)</Label>
            <Slider
              value={[saturation]}
              onValueChange={handleSaturationChange}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Luminosidade ({lightness}%)</Label>
            <Slider
              value={[lightness]}
              onValueChange={handleLightnessChange}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>
        </div>
        
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="210 100% 50%"
          className="text-xs font-mono"
        />
      </div>
    </Card>
  );
};

const PreviewComponents = () => (
  <Card className="p-6">
    <CardHeader className="px-0 pt-0">
      <CardTitle>Pré-visualização</CardTitle>
      <CardDescription>
        Veja como as alterações afetam os componentes
      </CardDescription>
    </CardHeader>
    <CardContent className="px-0">
      <div className="space-y-6">
        {/* Buttons Preview */}
        <div>
          <h4 className="font-medium mb-3">Botões</h4>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Danger</Button>
          </div>
        </div>

        <Separator />

        {/* Cards Preview */}
        <div>
          <h4 className="font-medium mb-3">Cards</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Item do Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold">📱</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">iPhone 13 Pro</p>
                    <p className="text-sm text-muted-foreground">128GB • Seminovo</p>
                  </div>
                  <Badge>Disponível</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">83</p>
                    <p className="text-sm text-muted-foreground">Total de itens</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-success">97%</p>
                    <p className="text-xs text-muted-foreground">Disponibilidade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Forms Preview */}
        <div>
          <h4 className="font-medium mb-3">Formulários</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label>Campo de busca</Label>
                <Input placeholder="Buscar por IMEI..." />
              </div>
              <div>
                <Label>Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="loaned">Emprestado</SelectItem>
                    <SelectItem value="sold">Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Alerts Preview */}
        <div>
          <h4 className="font-medium mb-3">Alertas</h4>
          <div className="space-y-3">
            <Alert>
              <AlertDescription>
                Este é um alerta informativo com o tema atual.
              </AlertDescription>
            </Alert>
            
            <Alert variant="destructive">
              <AlertDescription>
                Este é um alerta de erro com o tema atual.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DesignPanel = ({ onBack }: DesignPanelProps) => {
  const { theme, tokens, setTheme, updateTokens, resetTokens, saveTokens } = useTheme();
  const [selectedTab, setSelectedTab] = useState('colors');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateColorToken = (key: keyof ThemeTokens['colors'], value: string) => {
    updateTokens({
      colors: {
        ...tokens.colors,
        [key]: value
      }
    });
    setHasUnsavedChanges(true);
  };

  const updateBorderRadius = (value: string) => {
    const radiusValue = `${parseFloat(value)}rem`;
    updateTokens({
      borderRadius: {
        ...tokens.borderRadius,
        base: radiusValue,
        lg: radiusValue,
        md: `calc(${radiusValue} - 2px)`,
        sm: `calc(${radiusValue} - 4px)`,
      }
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    await saveTokens();
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    resetTokens();
    setHasUnsavedChanges(false);
    toast({
      title: "Tema resetado",
      description: "Todas as configurações foram restauradas para o padrão.",
    });
  };

  const exportTokens = () => {
    const dataStr = JSON.stringify(tokens, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `outlet-vault-theme-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Tema exportado",
      description: "Arquivo JSON baixado com sucesso.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Painel de Design
            </h1>
            <p className="text-muted-foreground">
              Customize a aparência do sistema em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-warning">
              Alterações não salvas
            </Badge>
          )}
          
          {/* Theme Mode Selector */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={theme === 'light' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme('light')}
              className="h-8 px-2"
            >
              <Sun className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme('system')}
              className="h-8 px-2"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="h-8 px-2"
            >
              <Moon className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={exportTokens}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Alert for unsaved changes */}
      {hasUnsavedChanges && (
        <Alert className="mb-6">
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar" para persistir as mudanças.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Cores</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="typography">Tipo</TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4">
              <ColorPicker
                label="Cor Principal (Primary)"
                value={tokens.colors.primary}
                onChange={(value) => updateColorToken('primary', value)}
              />
              
              <ColorPicker
                label="Cor Secundária"
                value={tokens.colors.secondary}
                onChange={(value) => updateColorToken('secondary', value)}
              />
              
              <ColorPicker
                label="Cor de Destaque (Accent)"
                value={tokens.colors.accent}
                onChange={(value) => updateColorToken('accent', value)}
              />
              
              <ColorPicker
                label="Sucesso"
                value={tokens.colors.success}
                onChange={(value) => updateColorToken('success', value)}
              />
              
              <ColorPicker
                label="Aviso"
                value={tokens.colors.warning}
                onChange={(value) => updateColorToken('warning', value)}
              />
              
              <ColorPicker
                label="Erro"
                value={tokens.colors.destructive}
                onChange={(value) => updateColorToken('destructive', value)}
              />

              <Separator />
              
              <ColorPicker
                label="Fundo"
                value={tokens.colors.background}
                onChange={(value) => updateColorToken('background', value)}
              />
              
              <ColorPicker
                label="Texto Principal"
                value={tokens.colors.foreground}
                onChange={(value) => updateColorToken('foreground', value)}
              />
              
              <ColorPicker
                label="Texto Secundário"
                value={tokens.colors.mutedForeground}
                onChange={(value) => updateColorToken('mutedForeground', value)}
              />
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <Card className="p-4">
                <Label className="font-medium">Border Radius Global</Label>
                <div className="mt-3">
                  <Slider
                    value={[parseFloat(tokens.borderRadius.base.replace('rem', '')) * 16]}
                    onValueChange={(value) => updateBorderRadius((value[0] / 16).toString())}
                    min={0}
                    max={32}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Atual: {tokens.borderRadius.base} ({parseFloat(tokens.borderRadius.base.replace('rem', '')) * 16}px)
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <Label className="font-medium">Espaçamento Base</Label>
                <div className="mt-3 space-y-2">
                  {Object.entries(tokens.spacing).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key}</span>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4">
              <Card className="p-4">
                <Label className="font-medium">Família de Fonte</Label>
                <div className="mt-3">
                  <Select
                    value={tokens.typography.fontFamily.split(',')[0]}
                    onValueChange={(value) => updateTokens({
                      typography: {
                        ...tokens.typography,
                        fontFamily: `${value}, ui-sans-serif, system-ui, sans-serif`
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="p-4">
                <Label className="font-medium">Tamanhos de Fonte</Label>
                <div className="mt-3 space-y-2">
                  {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className={`text-${key as keyof ThemeTokens['typography']['fontSize']} capitalize`}>{key}</span>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <PreviewComponents />
        </div>
      </div>
    </div>
  );
};

export default DesignPanel;