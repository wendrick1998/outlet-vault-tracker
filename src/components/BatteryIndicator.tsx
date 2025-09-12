import { Battery, BatteryLow, BatteryWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BatteryIndicatorProps {
  battery: number | null | undefined;
  editable?: boolean;
  onEdit?: (newValue: number | null) => void;
}

export const BatteryIndicator = ({ battery, editable = false, onEdit }: BatteryIndicatorProps) => {
  const getBatteryVariant = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "secondary";
    if (value >= 80) return "default";
    if (value >= 50) return "secondary"; 
    return "destructive";
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

  const Icon = getBatteryIcon(battery);

  if (editable) {
    // TODO: Implement inline editing functionality
    return (
      <Badge variant={getBatteryVariant(battery)} className="gap-1 cursor-pointer">
        <Icon className="h-3 w-3" />
        {getBatteryText(battery)}
      </Badge>
    );
  }

  return (
    <Badge variant={getBatteryVariant(battery)} className="gap-1">
      <Icon className="h-3 w-3" />
      {getBatteryText(battery)}
    </Badge>
  );
};