import { Battery, BatteryLow, BatteryWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BatteryIndicatorProps {
  percentage?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  battery?: number | null | undefined; // backward compatibility
  editable?: boolean;
  onEdit?: (newValue: number | null) => void;
}

export const BatteryIndicator = ({ 
  percentage,
  battery, 
  className,
  size = 'md',
  editable = false, 
  onEdit 
}: BatteryIndicatorProps) => {
  // Use percentage prop first, fallback to battery for backward compatibility
  const batteryValue = percentage !== undefined ? percentage : battery;
  
  const getBatteryVariant = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "secondary";
    if (value >= 80) return "default"; // success color mapping
    if (value >= 50) return "secondary"; // warning color mapping
    return "destructive"; // critical color mapping
  };

  const getBatteryIcon = (value: number | null | undefined) => {
    if (value === null || value === undefined) return Battery;
    if (value >= 80) return Battery;
    if (value >= 50) return BatteryWarning;
    return BatteryLow;
  };

  const getBatteryText = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return `${value}%`;
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5', 
    lg: 'text-sm px-3 py-1'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const Icon = getBatteryIcon(batteryValue);

  if (editable) {
    // TODO: Implement inline editing functionality
    return (
      <Badge 
        variant={getBatteryVariant(batteryValue)} 
        className={`gap-1 cursor-pointer ${sizeClasses[size]} ${className || ''}`}
      >
        <Icon className={iconSizes[size]} />
        {getBatteryText(batteryValue)}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={getBatteryVariant(batteryValue)} 
      className={`gap-1 ${sizeClasses[size]} ${className || ''}`}
    >
      <Icon className={iconSizes[size]} />
      {getBatteryText(batteryValue)}
    </Badge>
  );
};