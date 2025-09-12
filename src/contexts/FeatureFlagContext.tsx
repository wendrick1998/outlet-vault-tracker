import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface FeatureFlags {
  ai_analytics: boolean;
  smart_notifications: boolean;
  voice_commands: boolean;
  predictive_alerts: boolean;
  advanced_search: boolean;
  batch_operations: boolean;
  real_time_sync: boolean;
  offline_mode: boolean;
  smart_reporting: boolean;
  leaked_password_protection: boolean;
  leaked_password_protection_strict: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  ai_analytics: true,
  smart_notifications: true,
  voice_commands: false,
  predictive_alerts: true,
  advanced_search: true,
  batch_operations: true,
  real_time_sync: true,
  offline_mode: true,
  smart_reporting: true,
  leaked_password_protection: true,
  leaked_password_protection_strict: false,
};

interface FeatureFlagContextType {
  flags: FeatureFlags;
  setFlag: (flag: keyof FeatureFlags, enabled: boolean) => void;
  reset: () => void;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    try {
      const storedFlags = localStorage.getItem('feature_flags');
      if (storedFlags) {
        const parsed = JSON.parse(storedFlags);
        // Merge with defaults to handle new flags
        return { ...DEFAULT_FEATURE_FLAGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to parse stored feature flags:', error);
    }
    return DEFAULT_FEATURE_FLAGS;
  });

  // Persist flags to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('feature_flags', JSON.stringify(flags));
    } catch (error) {
      console.warn('Failed to persist feature flags:', error);
    }
  }, [flags]);

  const setFlag = useCallback((flag: keyof FeatureFlags, enabled: boolean) => {
    setFlags(prev => ({ ...prev, [flag]: enabled }));
  }, []);

  const reset = useCallback(() => {
    setFlags(DEFAULT_FEATURE_FLAGS);
  }, []);

  const isEnabled = useCallback((flag: keyof FeatureFlags) => {
    return flags[flag] ?? DEFAULT_FEATURE_FLAGS[flag];
  }, [flags]);

  const value: FeatureFlagContextType = {
    flags,
    setFlag,
    reset,
    isEnabled
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag);
};