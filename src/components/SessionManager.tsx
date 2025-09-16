import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Smartphone, 
  Laptop, 
  Trash2, 
  Shield,
  Clock,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { SessionService } from '@/services/sessionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SessionData {
  id: string;
  session_token: string;
  user_agent?: string;
  ip_address?: string | null;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserSessions();
    }
  }, [user]);

  const loadUserSessions = async () => {
    try {
      setLoading(true);
      const data = await SessionService.getUserSessions();
      // Type cast the data to match our interface
      const typedData = data.map(session => ({
        ...session,
        ip_address: session.ip_address as string | null
      }));
      setSessions(typedData);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar sessões do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionToken: string) => {
    try {
      setRevoking(sessionToken);
      await SessionService.revokeSession(sessionToken);
      
      toast({
        title: "Sessão revogada",
        description: "A sessão foi revogada com sucesso",
      });
      
      await loadUserSessions();
    } catch (error) {
      console.error('Erro ao revogar sessão:', error);
      toast({
        title: "Erro",
        description: "Erro ao revogar sessão",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      setRevoking('all');
      await SessionService.revokeAllUserSessions();
      
      toast({
        title: "Sessões revogadas",
        description: "Todas as outras sessões foram revogadas",
      });
      
      await loadUserSessions();
    } catch (error) {
      console.error('Erro ao revogar todas as sessões:', error);
      toast({
        title: "Erro",
        description: "Erro ao revogar sessões",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return 'Dispositivo desconhecido';
    
    // Extrair informações básicas do user agent
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    
    return 'Navegador desconhecido';
  };

  const isSessionExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const isCurrentSession = (sessionToken: string) => {
    // Verificar se é a sessão atual (simplificado)
    return false; // Implementar lógica mais robusta se necessário
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Sessões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-pulse">Carregando sessões...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gerenciar Sessões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {sessions.length} sessão(ões) ativa(s)
          </p>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={revokeAllOtherSessions}
              disabled={revoking === 'all'}
            >
              Revogar Todas as Outras
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(session.user_agent)}
                  <div>
                    <div className="font-medium text-sm">
                      {getDeviceInfo(session.user_agent)}
                    </div>
                    {isCurrentSession(session.session_token) && (
                      <Badge variant="secondary" className="text-xs">
                        Sessão atual
                      </Badge>
                    )}
                  </div>
                </div>
                
                {!isCurrentSession(session.session_token) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeSession(session.session_token)}
                    disabled={revoking === session.session_token}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Último acesso: {new Date(session.last_activity).toLocaleString('pt-BR')}
                </div>
                
                {session.ip_address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    IP: {session.ip_address}
                  </div>
                )}
              </div>

              {isSessionExpired(session.expires_at) && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Esta sessão expirou em {new Date(session.expires_at).toLocaleString('pt-BR')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Nenhuma sessão ativa encontrada.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};