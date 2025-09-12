import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface PerformanceMetrics {
  duration_minutes: number;
  efficiency_score: number;
  avg_scan_interval_seconds: number;
  scan_rate_per_minute: number;
}

interface OptimizedPerformanceCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ElementType;
  description?: string;
  metrics?: PerformanceMetrics;
  onViewDetails?: () => void;
}

export const OptimizedPerformanceCard = memo(({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon = BarChart3,
  description,
  metrics,
  onViewDetails 
}: OptimizedPerformanceCardProps) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${getChangeColor()}`}>
              {getChangeIcon()}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">{value}</div>
        
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {metrics && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Eficiência</span>
              <span className={getEfficiencyColor(metrics.efficiency_score)}>
                {metrics.efficiency_score}%
              </span>
            </div>
            <Progress 
              value={metrics.efficiency_score} 
              className="h-1"
            />
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="block font-medium">Taxa/min</span>
                <span>{metrics.scan_rate_per_minute.toFixed(1)}</span>
              </div>
              <div>
                <span className="block font-medium">Duração</span>
                <span>{Math.round(metrics.duration_minutes)}min</span>
              </div>
            </div>
          </div>
        )}

        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails} className="w-full">
            Ver Detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

OptimizedPerformanceCard.displayName = 'OptimizedPerformanceCard';