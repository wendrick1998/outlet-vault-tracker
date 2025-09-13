import { useState } from "react";
import { ArrowLeft, FileText, Folder, Component, Palette, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SCREENS_INVENTORY, COMPONENTS_INVENTORY, TOKEN_MAPPING, QUICK_CHANGE_GUIDE } from "@/design/UIInventory";

interface UIInventoryProps {
  onBack: () => void;
}

export const UIInventory = ({ onBack }: UIInventoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("screens");

  const filteredScreens = SCREENS_INVENTORY.filter(screen =>
    screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    screen.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredComponents = COMPONENTS_INVENTORY.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenFile = (filePath: string) => {
    // Em um ambiente real, isso abriria o arquivo no editor
    console.log(`Opening file: ${filePath}`);
  };

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
          <h1 className="text-2xl font-bold">UI Inventory</h1>
          <p className="text-muted-foreground">
            Mapa completo de telas, componentes e tokens do sistema
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Buscar telas, componentes ou arquivos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="screens">Telas ({SCREENS_INVENTORY.length})</TabsTrigger>
          <TabsTrigger value="components">Componentes ({COMPONENTS_INVENTORY.length})</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="guide">Guia Rápido</TabsTrigger>
        </TabsList>

        {/* Screens Tab */}
        <TabsContent value="screens" className="space-y-4">
          <div className="grid gap-4">
            {filteredScreens.map((screen) => (
              <Card key={screen.route} className="hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-primary" />
                        {screen.name}
                      </CardTitle>
                      <CardDescription>{screen.description}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{screen.route}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFile(screen.component)}
                          className="h-6 px-2 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {screen.component}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-sm">Detalhes</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium mb-2">Componentes</h4>
                            <div className="flex flex-wrap gap-1">
                              {screen.subComponents.map((comp) => (
                                <Badge key={comp} variant="secondary" className="text-xs">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Estados</h4>
                            <div className="flex flex-wrap gap-1">
                              {screen.states.map((state) => (
                                <Badge key={state} variant="outline" className="text-xs">
                                  {state}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Ações</h4>
                            <div className="flex flex-wrap gap-1">
                              {screen.actions.map((action) => (
                                <Badge key={action} variant="default" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Dependências</h4>
                            <div className="flex flex-wrap gap-1">
                              {screen.dependencies.map((dep) => (
                                <Badge key={dep} variant="secondary" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <div className="grid gap-4">
            {filteredComponents.map((component) => (
              <Card key={component.name} className="hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Component className="h-5 w-5 text-accent" />
                        {component.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFile(component.file)}
                          className="h-6 px-2 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {component.file}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Props</h4>
                      <div className="flex flex-wrap gap-1">
                        {component.props.map((prop) => (
                          <Badge key={prop} variant="secondary" className="text-xs">
                            {prop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Variantes</h4>
                      <div className="flex flex-wrap gap-1">
                        {component.variants.map((variant) => (
                          <Badge key={variant} variant="outline" className="text-xs">
                            {variant}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Estados</h4>
                      <div className="flex flex-wrap gap-1">
                        {component.states.map((state) => (
                          <Badge key={state} variant="default" className="text-xs">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tokens</h4>
                      <div className="flex flex-wrap gap-1">
                        {component.tokens.map((token) => (
                          <Badge key={token} variant="secondary" className="text-xs font-mono">
                            {token}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {component.examples.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-sm">Exemplos de Uso</h4>
                      <div className="flex flex-wrap gap-1">
                        {component.examples.map((example) => (
                          <Badge key={example} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <div className="grid gap-6">
            {Object.entries(TOKEN_MAPPING).map(([category, tokens]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 capitalize">
                    <Palette className="h-5 w-5 text-primary" />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(tokens).map(([key, token]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{key}</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {token}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quick Guide Tab */}
        <TabsContent value="guide" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(QUICK_CHANGE_GUIDE).map(([key, guide]) => (
              <Card key={key}>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  {key}
                </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Token</h4>
                      <div className="space-y-1">
                        <code className="block bg-muted px-2 py-1 rounded text-xs font-mono">
                          {guide.token}
                        </code>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Arquivos</h4>
                      <div className="space-y-1">
                        {guide.files.map((file) => (
                          <Button
                            key={file}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenFile(file)}
                            className="h-6 px-2 text-xs justify-start w-full"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {file}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Classes CSS</h4>
                      <div className="space-y-1">
                        {guide.classes.map((className) => (
                          <code key={className} className="block bg-muted px-2 py-1 rounded text-xs">
                            {className}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};