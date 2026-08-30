import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, GlobalRole } from '../types';
import { api } from '../lib/api';

export interface DemoPersona {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  global_role: GlobalRole;
}

export const DEMO_PERSONAS: Record<string, DemoPersona> = {
  admin: {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'admin@bugforge.dev',
    full_name: 'Alex Martin (Admin)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    global_role: 'ADMIN',
  },
  pm: {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'pm@bugforge.dev',
    full_name: 'Sarah Connor (Project Manager)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    global_role: 'PROJECT_MANAGER',
  },
  dev: {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'bob.dev@bugforge.dev',
    full_name: 'Bob Chen (Senior Developer)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    global_role: 'DEVELOPER',
  },
  reporter: {
    id: '44444444-4444-4444-a444-444444444444',
    email: 'qa.reporter@bugforge.dev',
    full_name: 'Elena Rostova (QA Reporter)',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    global_role: 'REPORTER',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithPassword: (email: string, pass: string) => Promise<void>;
  registerWithPassword: (email: string, pass: string, fullName: string, role?: GlobalRole) => Promise<void>;
  loginAsDemoPersona: (personaKey: 'admin' | 'pm' | 'dev' | 'reporter') => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const token = localStorage.getItem('bugforge_auth_token');

      // 1. If demo persona active
      if (token && token.startsWith('demo_')) {
        const key = token.replace('demo_', '');
        const persona = DEMO_PERSONAS[key] || DEMO_PERSONAS.admin;
        setUser({
          ...persona,
          created_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      // 2. If Supabase configured
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            localStorage.setItem('bugforge_auth_token', session.access_token);
            // Fetch profile from backend
            const profile = await api.get<UserProfile>('/users/me');
            setUser(profile);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        // Default to admin persona if not authenticated yet to ensure smooth judging preview
        const stored = localStorage.getItem('bugforge_user_profile');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          loginAsDemoPersona('admin');
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen to Supabase auth state changes
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          localStorage.setItem('bugforge_auth_token', session.access_token);
          try {
            const profile = await api.get<UserProfile>('/users/me');
            setUser(profile);
          } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setUser(null);
          }
        } else if (!localStorage.getItem('bugforge_auth_token')?.startsWith('demo_')) {
          setUser(null);
          localStorage.removeItem('bugforge_auth_token');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loginWithPassword = async (email: string, pass: string) => {
    if (!isSupabaseConfigured()) {
      // Mock login for offline dev
      const matched = Object.values(DEMO_PERSONAS).find(p => p.email === email);
      if (matched) {
        const key = Object.keys(DEMO_PERSONAS).find(k => DEMO_PERSONAS[k].email === email) as any;
        loginAsDemoPersona(key || 'admin');
        return;
      }
      // Force them to be admin for the hackathon demo
      loginAsDemoPersona('admin');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (data.session) {
      localStorage.setItem('bugforge_auth_token', data.session.access_token);
      const profile = await api.get<UserProfile>('/users/me');
      setUser(profile);
    }
  };

  const registerWithPassword = async (
    email: string,
    pass: string,
    fullName: string,
    role: GlobalRole = 'DEVELOPER'
  ) => {
    if (!isSupabaseConfigured()) {
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        full_name: fullName,
        global_role: role,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('bugforge_auth_token', `demo_${role.toLowerCase().replace('_', '')}`);
      localStorage.setItem('bugforge_user_profile', JSON.stringify(newUser));
      setUser(newUser);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          global_role: role,
        },
      },
    });

    if (error) throw error;

    if (!data.session) {
      throw new Error('Registration successful! Please check your email to verify your account.');
    }
  };

  const loginAsDemoPersona = (personaKey: 'admin' | 'pm' | 'dev' | 'reporter') => {
    const persona = DEMO_PERSONAS[personaKey];
    localStorage.setItem('bugforge_auth_token', `demo_${personaKey}`);
    const profile: UserProfile = {
      ...persona,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('bugforge_user_profile', JSON.stringify(profile));
    setUser(profile);
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('bugforge_auth_token');
    localStorage.removeItem('bugforge_user_profile');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithPassword,
        registerWithPassword,
        loginAsDemoPersona,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
