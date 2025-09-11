import React from 'react';
import { StatsCard } from '@/components/ui/stats-card';
import { LucideIcon } from 'lucide-react';

interface MemoizedStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const MemoizedStatsCard = React.memo(({ 
  title, 
  value, 
  icon 
}: MemoizedStatsCardProps) => {
  return (
    <StatsCard
      title={title}
      value={value}
      icon={icon}
    />
  );
});

MemoizedStatsCard.displayName = 'MemoizedStatsCard';