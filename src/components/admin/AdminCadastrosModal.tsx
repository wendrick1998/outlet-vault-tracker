import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { AdminCadastros } from "@/pages/admin/AdminCadastros";
import { RoleGuard } from "@/components/RoleGuard";
import { useFeatureFlag } from "@/lib/features";
import { FEATURE_FLAGS } from "@/lib/features";

export const AdminCadastrosModal = () => {
  const [open, setOpen] = useState(false);
  const isAdminCadastrosEnabled = useFeatureFlag(FEATURE_FLAGS.ADMIN_CADASTROS);

  if (!isAdminCadastrosEnabled) {
    return null;
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Gerenciar Cadastros
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastros do Sistema</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <AdminCadastros />
          </div>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
};