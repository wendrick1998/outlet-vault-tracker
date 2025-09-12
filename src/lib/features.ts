// Feature flags system for controlled feature rollout
import { useState, useEffect } from 'react';

// Available feature flags
export const FEATURE_FLAGS = {
  // Phase F0 - Infrastructure & Security
  ENHANCED_AUDIT_LOGGING: 'enhanced_audit_logging',
  LEAKED_PASSWORD_PROTECTION: 'leaked_password_protection',
  STREAMING_AI_ANALYTICS: 'streaming_ai_analytics',
  
  // Phase F1 - Advanced Inventory
  ADVANCED_INVENTORY_SEARCH: 'advanced_inventory_search',
  BATCH_OPERATIONS: 'batch_operations', 
  INVENTORY_CATEGORIES: 'inventory_categories',
  
  // Phase F2 - Granular Roles
  GRANULAR_PERMISSIONS: 'granular_permissions',
  ROLE_BASED_VISIBILITY: 'role_based_visibility',
  
  // Phase F3 - Structured Reasons
  REASON_CATEGORIES: 'reason_categories',
  REASON_WORKFLOWS: 'reason_workflows',
  SLA_TRACKING: 'sla_tracking',
  
  // Phase F4 - Advanced Movements
  REAL_TIME_SYNC: 'real_time_sync',
  OFFLINE_QUEUE: 'offline_queue',
  ADVANCED_REPORTING: 'advanced_reporting'
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

// Default feature states (can be overridden by localStorage or admin)
const DEFAULT_FEATURES: Record<FeatureFlag, boolean> = {
  [FEATURE_FLAGS.ENHANCED_AUDIT_LOGGING]: true,
  [FEATURE_FLAGS.LEAKED_PASSWORD_PROTECTION]: true, // Nova funcionalidade de segurança
  [FEATURE_FLAGS.STREAMING_AI_ANALYTICS]: false, // Streaming em beta
  [FEATURE_FLAGS.ADVANCED_INVENTORY_SEARCH]: true,
  [FEATURE_FLAGS.BATCH_OPERATIONS]: true,
  [FEATURE_FLAGS.INVENTORY_CATEGORIES]: true,
  [FEATURE_FLAGS.GRANULAR_PERMISSIONS]: true,
  [FEATURE_FLAGS.ROLE_BASED_VISIBILITY]: false,
  [FEATURE_FLAGS.REASON_CATEGORIES]: true,
  [FEATURE_FLAGS.REASON_WORKFLOWS]: true,
  [FEATURE_FLAGS.SLA_TRACKING]: true,
  [FEATURE_FLAGS.REAL_TIME_SYNC]: true,
  [FEATURE_FLAGS.OFFLINE_QUEUE]: true,
  [FEATURE_FLAGS.ADVANCED_REPORTING]: true
};

class FeatureFlagsManager {
  private features: Record<FeatureFlag, boolean> = { ...DEFAULT_FEATURES };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('feature_flags');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.features = { ...DEFAULT_FEATURES, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('feature_flags', JSON.stringify(this.features));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  isEnabled(flag: FeatureFlag): boolean {
    return this.features[flag] ?? false;
  }

  setEnabled(flag: FeatureFlag, enabled: boolean) {
    this.features[flag] = enabled;
    this.saveToStorage();
    this.notifyListeners();
  }

  getAll(): Record<FeatureFlag, boolean> {
    return { ...this.features };
  }

  reset() {
    this.features = { ...DEFAULT_FEATURES };
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const featureFlagsManager = new FeatureFlagsManager();

// React hook for using feature flags
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(featureFlagsManager.isEnabled(flag));

  useEffect(() => {
    const unsubscribe = featureFlagsManager.subscribe(() => {
      setEnabled(featureFlagsManager.isEnabled(flag));
    });

    return () => {
      unsubscribe();
    };
  }, [flag]);

  return enabled;
}

// React hook for managing all feature flags (admin use)
export function useFeatureFlags(): {
  flags: Record<FeatureFlag, boolean>;
  setFlag: (flag: FeatureFlag, enabled: boolean) => void;
  reset: () => void;
} {
  const [flags, setFlags] = useState(featureFlagsManager.getAll());

  useEffect(() => {
    const unsubscribe = featureFlagsManager.subscribe(() => {
      setFlags(featureFlagsManager.getAll());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    flags,
    setFlag: featureFlagsManager.setEnabled.bind(featureFlagsManager),
    reset: featureFlagsManager.reset.bind(featureFlagsManager)
  };
}

// Utility function for conditional rendering
export function withFeatureFlag<T>(
  flag: FeatureFlag,
  component: T,
  fallback?: T
): T | null {
  return featureFlagsManager.isEnabled(flag) ? component : (fallback ?? null);
}