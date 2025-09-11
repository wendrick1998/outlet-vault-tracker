import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface OutflowSuccessProps {
  item: InventoryItem;
  onAddAnother: () => void;
  onBackToMenu: () => void;
}

export const OutflowSuccess = ({ item, onAddAnother, onBackToMenu }: OutflowSuccessProps) => {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-700">Saída Registrada com Sucesso!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium">{item.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IMEI:</span>
              <span className="font-mono text-sm">{item.imei}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-orange-600">Emprestado</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onAddAnother}
              className="w-full h-12 text-base"
              autoFocus
            >
              Adicionar Outro Aparelho
            </Button>
            
            <Button 
              onClick={onBackToMenu}
              variant="outline"
              className="w-full h-12 text-base"
            >
              Voltar ao Menu Principal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};