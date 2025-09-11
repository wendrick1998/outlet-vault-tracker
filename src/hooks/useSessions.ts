import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SessionService } from '@/services/sessionService';
import { toast } from '@/hooks/use-toast';

const SESSION_QUERY_KEYS = {
  sessions: ['sessions'] as const,
  userSessions: (userId?: string) => [...SESSION_QUERY_KEYS.sessions, 'user', userId] as const,
  allSessions: () => [...SESSION_QUERY_KEYS.sessions, 'all'] as const,
  workingHours: (userId: string) => [...SESSION_QUERY_KEYS.sessions, 'working-hours', userId] as const,
};

export function useUserSessions(userId?: string) {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.userSessions(userId),
    queryFn: () => SessionService.getUserSessions(userId),
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useAllSessions() {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.allSessions(),
    queryFn: SessionService.getAllActiveSessions,
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
}

export function useWorkingHours(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.workingHours(userId),
    queryFn: () => SessionService.isUserAllowedBySchedule(userId),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: SessionService.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.sessions });
      toast({
        title: "Sessão revogada",
        description: "A sessão foi revogada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível revogar a sessão.",
        variant: "destructive"
      });
    }
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: SessionService.revokeAllUserSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.sessions });
      toast({
        title: "Sessões revogadas",
        description: "Todas as sessões do usuário foram revogadas."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível revogar as sessões.",
        variant: "destructive"
      });
    }
  });
}