import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Clock } from 'lucide-react';
import { SensitiveDataAccessRequest } from './SensitiveDataAccessRequest';
import { supabase } from '@/integrations/supabase/client';

interface SensitiveDataDisplayProps {
  customer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    cpf?: string | null;
    address?: string | null;
    notes?: string | null;
  };
  userRole?: 'admin' | 'manager' | 'user';
}

interface AccessSession {
  sessionId: string;
  approvedFields: string[];
  expiresAt: Date;
}

export const SensitiveDataDisplay = ({ customer, userRole }: SensitiveDataDisplayProps) => {
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [activeSession, setActiveSession] = useState<AccessSession | null>(null);
  const [sensitiveData, setSensitiveData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canRequestAccess = userRole === 'admin' || userRole === 'manager';
  const hasActiveSession = activeSession && new Date() < activeSession.expiresAt;

  const handleAccessGranted = async (sessionId: string, approvedFields: string[]) => {
    setActiveSession({
      sessionId,
      approvedFields,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    // Fetch the sensitive data with the session
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_customer_with_session_validation', {
        p_customer_id: customer.id,
        p_session_id: sessionId
      });

      if (error) throw error;
      setSensitiveData(data);
    } catch (error) {
      console.error('Error fetching sensitive data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const renderSensitiveField = (fieldName: string, value: string | null, formatter?: (val: string) => string) => {
    const isAuthorized = hasActiveSession && activeSession.approvedFields.includes(fieldName);
    
    if (!value) return null;

    if (!isAuthorized) {
      return (
        <div className="flex items-center gap-2 p-2 border border-dashed border-muted rounded">
          <EyeOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Campo protegido</span>
        </div>
      );
    }

    const displayValue = formatter ? formatter(value) : value;
    
    return (
      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
        <Eye className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium">{displayValue}</span>
        <Badge variant="outline" className="text-xs bg-amber-100">
          Acesso temporário
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Basic info - always visible */}
      <div>
        <h3 className="font-semibold">{customer.name}</h3>
      </div>

      {/* Access control info */}
      {canRequestAccess && (
        <div className="space-y-3">
          {hasActiveSession ? (
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>Acesso ativo aos campos: {activeSession.approvedFields.join(', ')}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Expira em {Math.ceil((activeSession.expiresAt.getTime() - Date.now()) / 60000)} min
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccessRequest(true)}
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Solicitar Acesso a Dados Sensíveis
            </Button>
          )}
        </div>
      )}

      {/* Sensitive data fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          {renderSensitiveField('email', sensitiveData?.email || customer.email)}
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Telefone</label>
          {renderSensitiveField('phone', sensitiveData?.phone || customer.phone, formatPhone)}
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">CPF</label>
          {renderSensitiveField('cpf', sensitiveData?.cpf || customer.cpf, formatCPF)}
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Endereço</label>
          {renderSensitiveField('address', sensitiveData?.address || customer.address)}
        </div>
      </div>

      {/* Notes - full width */}
      {(sensitiveData?.notes || customer.notes) && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Observações</label>
          {renderSensitiveField('notes', sensitiveData?.notes || customer.notes)}
        </div>
      )}

      {/* Access request dialog */}
      <SensitiveDataAccessRequest
        customerId={customer.id}
        customerName={customer.name}
        isOpen={showAccessRequest}
        onClose={() => setShowAccessRequest(false)}
        onAccessGranted={handleAccessGranted}
      />
    </div>
  );
};