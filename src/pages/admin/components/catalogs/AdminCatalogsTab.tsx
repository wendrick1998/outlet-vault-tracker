import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, HardDrive, Package, Tag, Smartphone } from "lucide-react";
import { BrandsManager } from "./BrandsManager";
import { ColorsManager } from "./ColorsManager";
import { StoragesManager } from "./StoragesManager";
import { ConditionsManager } from "./ConditionsManager";
import { LabelsManager } from "./LabelsManager";

export const AdminCatalogsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Entidades & Campos Personalizados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gerencie os catálogos que abastecem os formulários de aparelhos
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="brands" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="brands" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Marcas
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              Cores
            </TabsTrigger>
            <TabsTrigger value="storages" className="gap-2">
              <HardDrive className="h-4 w-4" />
              Armazenamentos
            </TabsTrigger>
            <TabsTrigger value="conditions" className="gap-2">
              <Package className="h-4 w-4" />
              Condições
            </TabsTrigger>
            <TabsTrigger value="labels" className="gap-2">
              <Tag className="h-4 w-4" />
              Etiquetas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brands">
            <BrandsManager />
          </TabsContent>

          <TabsContent value="colors">
            <ColorsManager />
          </TabsContent>

          <TabsContent value="storages">
            <StoragesManager />
          </TabsContent>

          <TabsContent value="conditions">
            <ConditionsManager />
          </TabsContent>

          <TabsContent value="labels">
            <LabelsManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};