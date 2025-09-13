import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    destructive: string;
    background: string;
    foreground: string;
    muted: string;
    mutesForeground: string;
    border: string;
    input: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
  };
  borderRadius: {
    base: string;
    lg: string;
    md: string;
    sm: string;
  };
  spacing: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
}

const defaultTokens: ThemeTokens = {
  colors: {
    primary: '210 100% 50%',
    secondary: '210 20% 95%',
    accent: '142 76% 36%',
    success: '142 76% 36%',
    warning: '38 92% 50%',
    destructive: '0 84% 60%',
    background: '240 10% 98%',
    foreground: '240 10% 8%',
    muted: '210 15% 88%',
    mutesForeground: '240 15% 30%',
    border: '210 20% 75%',
    input: '210 20% 92%',
    card: '0 0% 100%',
    cardForeground: '240 10% 8%',
    popover: '0 0% 100%',
    popoverForeground: '240 10% 8%',
  },
  borderRadius: {
    base: '0.375rem',
    lg: '0.75rem',
    md: '0.5rem',
    sm: '0.25rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    base: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  tokens: ThemeTokens;
  setTheme: (theme: Theme) => void;
  updateTokens: (tokens: Partial<ThemeTokens>) => void;
  resetTokens: () => void;
  saveTokens: () => Promise<void>;
  loadTokens: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [tokens, setTokens] = useState<ThemeTokens>(() => {
    const savedTokens = localStorage.getItem(`${storageKey}-tokens`);
    return savedTokens ? JSON.parse(savedTokens) : defaultTokens;
  });

  const { user } = useAuth();

  const applyTokens = (newTokens: ThemeTokens) => {
    const root = window.document.documentElement;
    
    // Apply color tokens
    Object.entries(newTokens.colors).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });

    // Apply border radius tokens
    Object.entries(newTokens.borderRadius).forEach(([key, value]) => {
      if (key === 'base') {
        root.style.setProperty('--radius', value);
      } else {
        root.style.setProperty(`--radius-${key}`, value);
      }
    });

    // Apply spacing tokens
    Object.entries(newTokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply typography tokens
    root.style.setProperty('--font-family', newTokens.typography.fontFamily);
    Object.entries(newTokens.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
  };

  const updateTokens = (newTokens: Partial<ThemeTokens>) => {
    const updatedTokens = {
      ...tokens,
      ...newTokens,
      colors: { ...tokens.colors, ...(newTokens.colors || {}) },
      borderRadius: { ...tokens.borderRadius, ...(newTokens.borderRadius || {}) },
      spacing: { ...tokens.spacing, ...(newTokens.spacing || {}) },
      typography: {
        ...tokens.typography,
        ...(newTokens.typography || {}),
        fontSize: {
          ...tokens.typography.fontSize,
          ...(newTokens.typography?.fontSize || {}),
        },
      },
    };
    
    setTokens(updatedTokens);
    applyTokens(updatedTokens);
    localStorage.setItem(`${storageKey}-tokens`, JSON.stringify(updatedTokens));
  };

  const resetTokens = () => {
    setTokens(defaultTokens);
    applyTokens(defaultTokens);
    localStorage.setItem(`${storageKey}-tokens`, JSON.stringify(defaultTokens));
  };

  const saveTokens = async () => {
    try {
      localStorage.setItem(`${storageKey}-tokens-saved`, JSON.stringify(tokens));
      localStorage.setItem(`${storageKey}-saved`, theme);
      
      toast({
        title: "Tema salvo",
        description: "Suas preferências de tema foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as preferências de tema.",
        variant: "destructive",
      });
    }
  };

  const loadTokens = async () => {
    try {
      const savedTokens = localStorage.getItem(`${storageKey}-tokens-saved`);
      const savedTheme = localStorage.getItem(`${storageKey}-saved`);

      if (savedTokens) {
        const parsedTokens = JSON.parse(savedTokens);
        setTokens(parsedTokens);
        applyTokens(parsedTokens);
      }

      if (savedTheme) {
        setTheme(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  useEffect(() => {
    applyTokens(tokens);
  }, []);

  useEffect(() => {
    loadTokens();
  }, []);

  const value = {
    theme,
    tokens,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
    updateTokens,
    resetTokens,
    saveTokens,
    loadTokens,
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};