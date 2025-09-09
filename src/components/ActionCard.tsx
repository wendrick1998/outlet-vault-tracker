import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'warning';
  badge?: string;
}

export const ActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  variant = 'default',
  badge 
}: ActionCardProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:from-primary/15 hover:to-primary/8";
      case 'warning':
        return "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:from-warning/15 hover:to-warning/8";
      default:
        return "bg-gradient-card hover:shadow-medium";
    }
  };

  return (
    <Card 
      className={`
        relative cursor-pointer transition-all duration-200 
        ${getVariantClasses()}
        hover:shadow-medium hover:-translate-y-1
        min-h-[120px] p-6
      `}
      onClick={onClick}
    >
      {badge && (
        <div className="absolute -top-2 -right-2 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full shadow-soft">
          {badge}
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-xl shadow-soft
          ${variant === 'primary' ? 'bg-primary text-primary-foreground' : ''}
          ${variant === 'warning' ? 'bg-warning text-warning-foreground' : ''}
          ${variant === 'default' ? 'bg-muted text-foreground' : ''}
        `}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
};