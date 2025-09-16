import React from 'react';
import { ItemCard } from '@/components/ItemCard';
import { ActionCard } from '@/components/ActionCard';
import { BatteryIndicator } from '@/components/BatteryIndicator';
import { StatsCard } from '@/components/ui/stats-card';
import { ConferenceReportExporter } from '@/components/ConferenceReportExporter';
import { DeviceActions } from '@/components/DeviceActions';
import { OfflineQueue } from '@/components/OfflineQueue';
import { ScanFeedback } from '@/components/ScanFeedback';
import { SmartFormHelper } from '@/components/SmartFormHelper';

// Memoized versions of heavy components for better performance
export const MemoizedItemCard = React.memo(ItemCard);
export const MemoizedActionCard = React.memo(ActionCard);
export const MemoizedBatteryIndicator = React.memo(BatteryIndicator);
export const MemoizedStatsCard = React.memo(StatsCard);
export const MemoizedConferenceReportExporter = React.memo(ConferenceReportExporter);
export const MemoizedDeviceActions = React.memo(DeviceActions);
export const MemoizedOfflineQueue = React.memo(OfflineQueue);
export const MemoizedScanFeedback = React.memo(ScanFeedback);
export const MemoizedSmartFormHelper = React.memo(SmartFormHelper);

// Set display names for better debugging
MemoizedItemCard.displayName = 'MemoizedItemCard';
MemoizedActionCard.displayName = 'MemoizedActionCard';
MemoizedBatteryIndicator.displayName = 'MemoizedBatteryIndicator';
MemoizedStatsCard.displayName = 'MemoizedStatsCard';
MemoizedConferenceReportExporter.displayName = 'MemoizedConferenceReportExporter';
MemoizedDeviceActions.displayName = 'MemoizedDeviceActions';
MemoizedOfflineQueue.displayName = 'MemoizedOfflineQueue';
MemoizedScanFeedback.displayName = 'MemoizedScanFeedback';
MemoizedSmartFormHelper.displayName = 'MemoizedSmartFormHelper';