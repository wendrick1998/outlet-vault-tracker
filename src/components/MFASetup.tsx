import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Copy, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MFASetupProps {
  userId: string;
  onComplete?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ userId, onComplete }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Mock secret key for demo - in production this would come from server
  const secretKey = 'JBSWY3DPEHPK3PXP';
  
  // Mock backup codes - in production these would be generated server-side
  const backupCodes = [
    '123456789',
    '987654321',
    '456789123',
    '789123456',
    '321654987'
  ];

  const qrCodeUrl = `otpauth://totp/CofreTracker:${userId}?secret=${secretKey}&issuer=CofreTracker`;

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    
    // Simulate verification - in production, verify against server
    setTimeout(() => {
      if (verificationCode.length === 6) {
        toast({
          title: "MFA Configurado",
          description: "Autenticação de dois fatores ativada com sucesso!"
        });
        setStep('backup');
      } else {
        toast({
          title: "Código inválido", 
          description: "Verifique o código e tente novamente",
          variant: "destructive"
        });
      }
      setIsVerifying(false);
    }, 1000);
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado",
      description: "Código de backup copiado para a área de transferência"
    });
  };

  const completeSetup = () => {
    setStep('complete');
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  if (step === 'setup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Configurar MFA</CardTitle>
          <CardDescription>
            Configure a autenticação de dois fatores para maior segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              1. Baixe um app autenticador (Google Authenticator, Authy, etc.)
              <br />
              2. Escaneie o QR code abaixo ou digite a chave manualmente
              <br />
              3. Digite o código de 6 dígitos para confirmar
            </AlertDescription>
          </Alert>
          
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center mb-2">
              <span className="text-xs text-muted-foreground">QR Code</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Chave manual: <code className="font-mono">{secretKey}</code>
            </p>
          </div>

          <Button onClick={() => setStep('verify')} className="w-full">
            Continuar para Verificação
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Verificar Código</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos do seu app autenticador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Código de Verificação</Label>
            <Input
              id="verification-code"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-widest font-mono"
              maxLength={6}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">
              Voltar
            </Button>
            <Button 
              onClick={handleVerifyCode} 
              disabled={verificationCode.length !== 6 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'backup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Códigos de Backup</CardTitle>
          <CardDescription>
            Guarde estes códigos em local seguro. Use-os caso perca acesso ao seu dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Cada código pode ser usado apenas uma vez. Guarde-os em local seguro!
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Códigos de Backup</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="bg-muted p-3 rounded-lg space-y-1">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <code className={`font-mono text-sm ${showBackupCodes ? '' : 'blur-sm'}`}>
                    {code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyBackupCode(code)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={completeSetup} className="w-full">
            Finalizar Configuração
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">MFA Configurado!</h3>
            <p className="text-muted-foreground">
              Sua conta agora está protegida com autenticação de dois fatores.
            </p>
          </div>
          <Badge variant="default" className="bg-success">
            Segurança Aprimorada
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return null;
};