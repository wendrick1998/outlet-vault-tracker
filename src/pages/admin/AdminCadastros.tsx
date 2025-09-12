import { useState } from "react";
import { Users, Smartphone, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGuard } from "@/components/RoleGuard";
import { AdminUsersTab } from "./components/users/AdminUsersTab";
import { AdminModelsTab } from "./components/models/AdminModelsTab";
import { AdminDevicesTab } from "./components/devices/AdminDevicesTab";
import { AdminCatalogsTab } from "./components/catalogs/AdminCatalogsTab";

export const AdminCadastros = () => {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Cadastros do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie usuários autorizados, modelos de aparelhos e inventário
            </p>
          </div>
        </Card>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários Autorizados
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Modelos de Aparelhos
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2">
              <Smartphone className="h-4 w-4" />
              Aparelhos (Inventário)
            </TabsTrigger>
            <TabsTrigger value="catalogs" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Entidades & Campos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="models">
            <AdminModelsTab />
          </TabsContent>

          <TabsContent value="devices">
            <AdminDevicesTab />
          </TabsContent>

          <TabsContent value="catalogs">
            <AdminCatalogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
};