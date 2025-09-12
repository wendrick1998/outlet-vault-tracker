import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackState {
  type: 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';
  message?: string;
}

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state?: FeedbackState;
  loadingText?: string;
  successText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, state = { type: 'idle' }, loadingText, successText, children, disabled, ...props }, ref) => {
    const isLoading = state.type === 'loading';
    const isSuccess = state.type === 'success';
    const isError = state.type === 'error';

    const getButtonContent = () => {
      switch (state.type) {
        case 'loading':
          return (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {loadingText || 'Carregando...'}
            </>
          );
        case 'success':
          return (
            <>
              <CheckCircle className="h-4 w-4 mr-2 text-success" />
              {successText || 'Sucesso!'}
            </>
          );
        case 'error':
          return (
            <>
              <XCircle className="h-4 w-4 mr-2 text-destructive" />
              {state.message || 'Erro'}
            </>
          );
        default:
          return children;
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-200",
          isSuccess && "bg-success hover:bg-success/90",
          isError && "bg-destructive hover:bg-destructive/90",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {getButtonContent()}
      </Button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

interface ProgressFeedbackProps {
  progress: number;
  message?: string;
  className?: string;
}

export const ProgressFeedback = ({ progress, message, className }: ProgressFeedbackProps) => (
  <div className={cn("space-y-2", className)}>
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{message || 'Processando...'}</span>
      <span className="font-medium">{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-secondary rounded-full h-2">
      <div 
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StatusIndicator = ({ status, size = 'md', showLabel = false, className }: StatusIndicatorProps) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3", 
    lg: "h-4 w-4"
  };

  const statusConfig = {
    online: { color: "bg-success", label: "Online" },
    offline: { color: "bg-muted-foreground", label: "Offline" },
    busy: { color: "bg-destructive", label: "Ocupado" },
    away: { color: "bg-warning", label: "Ausente" }
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "rounded-full animate-pulse",
        sizeClasses[size],
        config.color
      )} />
      {showLabel && (
        <span className="text-sm text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
};

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export const NotificationBadge = ({ count, max = 99, className }: NotificationBadgeProps) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <div className={cn(
      "absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1",
      "animate-scale-in",
      className
    )}>
      {displayCount}
    </div>
  );
};

interface TooltipFeedbackProps {
  children: React.ReactNode;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const TooltipFeedback = ({ children, content, type = 'info' }: TooltipFeedbackProps) => {
  const [show, setShow] = React.useState(false);

  const typeConfig = {
    info: { icon: Info, color: "bg-primary" },
    success: { icon: CheckCircle, color: "bg-success" },
    warning: { icon: AlertCircle, color: "bg-warning" },
    error: { icon: XCircle, color: "bg-destructive" }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={cn(
          "absolute z-50 px-3 py-2 text-sm text-white rounded-lg shadow-lg",
          "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
          "animate-fade-in",
          config.color
        )}>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {content}
          </div>
          <div className={cn(
            "absolute top-full left-1/2 transform -translate-x-1/2",
            "border-4 border-transparent",
            config.color === "bg-primary" && "border-t-primary",
            config.color === "bg-success" && "border-t-success",
            config.color === "bg-warning" && "border-t-warning",
            config.color === "bg-destructive" && "border-t-destructive"
          )} />
        </div>
      )}
    </div>
  );
};