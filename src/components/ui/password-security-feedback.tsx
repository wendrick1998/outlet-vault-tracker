import React from 'react';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { PasswordSecurityResult } from '@/services/passwordSecurityService';

interface PasswordSecurityFeedbackProps {
  result?: PasswordSecurityResult;
  isLoading?: boolean;
}

export const PasswordSecurityFeedback: React.FC<PasswordSecurityFeedbackProps> = ({ 
  result, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Alert className="border-muted">
        <Shield className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Verificando segurança da senha...
        </AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  // Determine alert variant and icon based on result
  const getAlertProps = () => {
    if (!result.isValid) {
      return {
        className: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        icon: ShieldAlert
      };
    }
    
    if (result.warnings.length > 0) {
      return {
        className: "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600",
        icon: AlertTriangle
      };
    }
    
    return {
      className: "border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600",
      icon: ShieldCheck
    };
  };

  const { className, icon: Icon } = getAlertProps();

  return (
    <div className="space-y-2">
      <Alert className={className}>
        <Icon className="h-4 w-4" />
        <AlertDescription>
          {result.message}
          
          {result.isLeaked && result.breachCount && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                Encontrada em {result.breachCount.toLocaleString()} vazamentos
              </Badge>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {result.warnings.length > 0 && (
        <div className="space-y-1">
          {result.warnings.map((warning, index) => (
            <Alert key={index} className="border-yellow-500/30 py-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};