import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProfileService } from '@/services/profileService';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const profile = await ProfileService.getProfileById(userId);
      setProfile(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refetchProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id); // Debug logging
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events
        if (event === 'SIGNED_IN' && session?.user) {
          // Ensure user profile exists first
          setTimeout(async () => {
            try {
              await supabase.rpc('ensure_profile_exists', { 
                user_id: session.user.id 
              });
              console.log('Profile ensured for user:', session.user.id);
              // Then fetch the profile
              await fetchProfile(session.user.id);
            } catch (error) {
              console.error('Error ensuring profile:', error);
              // Fallback: still try to fetch profile
              await fetchProfile(session.user.id);
            }
          }, 0);
          
          toast({
            title: "Login realizado",
            description: "Bem-vindo de volta!"
          });
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          toast({
            title: "Logout realizado",
            description: "Você foi desconectado com sucesso"
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (session?.user && !profile) {
          // Fetch profile for existing sessions
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else if (!session?.user) {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        toast({
          title: "Erro de autenticação",
          description: "Erro ao verificar sessão",
          variant: "destructive"
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch profile if user exists
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return profile?.role === role && profile?.is_active === true;
  };

  const isAdmin = profile?.role === 'admin' && profile?.is_active === true;

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    signOut,
    isAuthenticated: !!user,
    hasRole,
    isAdmin,
    refetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};