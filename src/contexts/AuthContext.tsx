import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ProfileService } from '@/services/profileService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];
type Permission = Database['public']['Enums']['permission'];
type GranularRole = Database['public']['Enums']['granular_role'];

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
  mustChangePassword: boolean;
  clearMustChangePassword: () => void;
  // Novas funcionalidades granulares
  permissions: Permission[];
  granularRoles: GranularRole[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyRole: (roles: GranularRole[]) => boolean;
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
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [granularRoles, setGranularRoles] = useState<GranularRole[]>([]);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const profileData = await ProfileService.getCurrentProfile();
      setProfile(profileData);
      setMustChangePassword(profileData?.must_change_password ?? false);

      // Buscar permissões e roles granulares
      if (profileData) {
        try {
          const userPermissions = await PermissionService.getCurrentUserPermissions();
          setPermissions(userPermissions || []);

          const roleAssignments = await PermissionService.getUserRoleAssignments(userId);
          const activeRoles = roleAssignments
            .filter(ra => ra.is_active && (!ra.expires_at || new Date(ra.expires_at) > new Date()))
            .map(ra => ra.role);
          setGranularRoles(activeRoles);
        } catch (permError) {
          console.error('Error fetching permissions:', permError);
          setPermissions([]);
          setGranularRoles([]);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setMustChangePassword(false);
      setPermissions([]);
      setGranularRoles([]);
    } finally {
      setProfileLoading(false);
    }
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const clearMustChangePassword = () => {
    setMustChangePassword(false);
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events
        if (event === 'SIGNED_IN' && session?.user) {
          // Ensure user profile exists first
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              await supabase.rpc('ensure_profile_exists', { 
                user_id: session.user.id 
              });
              if (mounted) {
                fetchProfile(session.user.id);
              }
            } catch (error) {
              console.error('Error ensuring profile:', error);
              if (mounted) {
                fetchProfile(session.user.id);
              }
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setProfile(null);
          }
        } else if (session?.user && !profile) {
          // Fetch profile for existing sessions
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 100);
        } else if (!session?.user) {
          if (mounted) {
            setProfile(null);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch profile if user exists
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return profile?.role === role && profile?.is_active === true;
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyRole = (roles: GranularRole[]): boolean => {
    return roles.some(role => granularRoles.includes(role));
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
    refetchProfile,
    mustChangePassword,
    clearMustChangePassword,
    permissions,
    granularRoles,
    hasPermission,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};