import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ActiveSession = Database['public']['Tables']['active_sessions']['Row'];
type ActiveSessionInsert = Database['public']['Tables']['active_sessions']['Insert'];

export class SessionService {
  static async createSession(sessionToken: string, expiresAt: Date): Promise<ActiveSession> {
    const userAgent = navigator.userAgent;
    
    // Obter IP (será null no frontend, mas pode ser útil em edge functions)
    const { data, error } = await supabase
      .from('active_sessions')
      .insert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSessionActivity(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('active_sessions')
      .update({
        last_activity: new Date().toISOString()
      })
      .eq('session_token', sessionToken);

    if (error) throw error;
  }

  static async getUserSessions(userId?: string): Promise<ActiveSession[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!targetUserId) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAllActiveSessions(): Promise<ActiveSession[]> {
    const { data, error } = await supabase
      .from('active_sessions')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async revokeSession(sessionToken: string): Promise<void> {
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('session_token', sessionToken);

    if (error) throw error;
  }

  static async revokeAllUserSessions(userId?: string): Promise<void> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!targetUserId) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', targetUserId);

    if (error) throw error;
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await supabase.rpc('cleanup_expired_sessions');
  }

  static async isUserAllowedBySchedule(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_working_hours', {
      user_id: userId
    });

    if (error) throw error;
    return data || false;
  }
}