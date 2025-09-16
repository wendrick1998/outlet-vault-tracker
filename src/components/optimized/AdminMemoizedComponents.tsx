import React from 'react';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { BatchOperations } from '@/components/BatchOperations';
import { InventoryCategories } from '@/components/InventoryCategories';
import { RoleManagement } from '@/components/RoleManagement';
import { ReasonWorkflowManager } from '@/components/ReasonWorkflowManager';
import { SmartReporting } from '@/components/SmartReporting';
import { RealTimeSync } from '@/components/RealTimeSync';
import { CanaryDeploymentDashboard } from '@/components/CanaryDeploymentDashboard';
import { CanaryMetricsCollector } from '@/components/CanaryMetricsCollector';
import { FeatureFlagsAdmin } from '@/components/FeatureFlagsAdmin';
import type { InventoryItem } from '@/types/admin';

// Performance-optimized versions of heavy admin components
export const MemoizedAdvancedSearch = React.memo(AdvancedSearch);
export const MemoizedBatchOperations = React.memo(({ items, onRefresh }: { items: InventoryItem[]; onRefresh: () => void }) => (
  <BatchOperations items={items} onRefresh={onRefresh} />
));
export const MemoizedInventoryCategories = React.memo(InventoryCategories);
export const MemoizedRoleManagement = React.memo(RoleManagement);
export const MemoizedReasonWorkflowManager = React.memo(ReasonWorkflowManager);
export const MemoizedSmartReporting = React.memo(SmartReporting);
export const MemoizedRealTimeSync = React.memo(RealTimeSync);
export const MemoizedCanaryDeploymentDashboard = React.memo(CanaryDeploymentDashboard);
export const MemoizedCanaryMetricsCollector = React.memo(CanaryMetricsCollector);
export const MemoizedFeatureFlagsAdmin = React.memo(FeatureFlagsAdmin);

// Set display names for better debugging
MemoizedAdvancedSearch.displayName = 'MemoizedAdvancedSearch';
MemoizedBatchOperations.displayName = 'MemoizedBatchOperations';
MemoizedInventoryCategories.displayName = 'MemoizedInventoryCategories';
MemoizedRoleManagement.displayName = 'MemoizedRoleManagement';
MemoizedReasonWorkflowManager.displayName = 'MemoizedReasonWorkflowManager';
MemoizedSmartReporting.displayName = 'MemoizedSmartReporting';
MemoizedRealTimeSync.displayName = 'MemoizedRealTimeSync';
MemoizedCanaryDeploymentDashboard.displayName = 'MemoizedCanaryDeploymentDashboard';
MemoizedCanaryMetricsCollector.displayName = 'MemoizedCanaryMetricsCollector';
MemoizedFeatureFlagsAdmin.displayName = 'MemoizedFeatureFlagsAdmin';