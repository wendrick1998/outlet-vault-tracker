import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

export const StatsCard = ({ 
  title, 
  value,
  subtitle,
  icon: Icon, 
  variant = "default",
  className 
}: StatsCardProps) => {
  const variants = {
    default: "text-primary",
    success: "text-success", 
    warning: "text-warning",
    destructive: "text-destructive"
  };

  return (
    <Card className={cn("p-4 shadow-soft", className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className={cn("text-2xl font-bold", variants[variant])}>
            {value}
          </div>
          <div className="text-muted-foreground text-sm">{title}</div>
          {subtitle && (
            <div className="text-muted-foreground text-xs mt-1">{subtitle}</div>
          )}
        </div>
        {Icon && (
          <Icon className={cn("h-8 w-8 opacity-60", variants[variant])} />
        )}
      </div>
    </Card>
  );
};