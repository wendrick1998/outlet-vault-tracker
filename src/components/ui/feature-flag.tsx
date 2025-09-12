import React from 'react';
import { useFeatureFlag, type FeatureFlag } from '@/lib/features';

interface FeatureFlagProps {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component for conditional rendering based on feature flags
 */
export const FeatureFlagWrapper: React.FC<FeatureFlagProps> = ({ 
  flag, 
  children, 
  fallback = null 
}) => {
  const isEnabled = useFeatureFlag(flag);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

interface FeatureFlagGuardProps {
  flag: FeatureFlag;
  children: React.ReactNode;
}

/**
 * Simple guard component - only renders children if feature is enabled
 */
export const FeatureFlagGuard: React.FC<FeatureFlagGuardProps> = ({ 
  flag, 
  children 
}) => {
  const isEnabled = useFeatureFlag(flag);
  
  return isEnabled ? <>{children}</> : null;
};