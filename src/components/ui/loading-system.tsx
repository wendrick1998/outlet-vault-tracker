/**
 * Sistema Unificado de Loading
 * Consolida 5 componentes de loading diferentes em uma API única
 */
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Tipos base
interface BaseLoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

// Loading Spinner
interface LoadingSpinnerProps extends BaseLoadingProps {
  text?: string;
  variant?: "default" | "inline" | "fullscreen";
}

export const LoadingSpinner = ({ 
  className, 
  size = "md", 
  text,
  variant = "default" 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const variantClasses = {
    default: "flex items-center justify-center gap-3",
    inline: "inline-flex items-center gap-2",
    fullscreen: "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <span className={cn(
          "text-muted-foreground",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          {text}
        </span>
      )}
    </div>
  );
};

// Loading Skeleton
interface LoadingSkeletonProps extends BaseLoadingProps {
  rows?: number;
  showAvatar?: boolean;
  variant?: "default" | "card" | "table";
}

export const LoadingSkeleton = ({ 
  className, 
  rows = 3, 
  showAvatar = false,
  variant = "default"
}: LoadingSkeletonProps) => {
  const skeletonRow = (index: number) => (
    <div key={index} className="flex items-center space-x-4">
      {showAvatar && (
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted"></div>
      )}
      <div className="flex-1 space-y-2">
        <div className="h-4 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted"></div>
      </div>
    </div>
  );

  const cardSkeleton = (index: number) => (
    <div key={index} className="p-6 border rounded-lg">
      <div className="h-6 w-1/3 animate-pulse rounded bg-muted mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted"></div>
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
      </div>
    </div>
  );

  const tableSkeleton = (index: number) => (
    <tr key={index} className="border-b">
      <td className="p-4"><div className="h-4 animate-pulse rounded bg-muted"></div></td>
      <td className="p-4"><div className="h-4 animate-pulse rounded bg-muted"></div></td>
      <td className="p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div></td>
      <td className="p-4"><div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div></td>
    </tr>
  );

  const renderContent = () => {
    switch (variant) {
      case "card":
        return Array.from({ length: rows }).map((_, i) => cardSkeleton(i));
      case "table":
        return (
          <table className="w-full">
            <tbody>
              {Array.from({ length: rows }).map((_, i) => tableSkeleton(i))}
            </tbody>
          </table>
        );
      default:
        return Array.from({ length: rows }).map((_, i) => skeletonRow(i));
    }
  };

  return (
    <div className={cn(
      variant === "default" ? "space-y-4" : 
      variant === "card" ? "grid gap-4" : "",
      className
    )}>
      {renderContent()}
    </div>
  );
};

// Loading States (para componentes específicos)
interface LoadingStatesProps extends BaseLoadingProps {
  type: "page" | "component" | "inline" | "overlay";
  message?: string;
}

export const LoadingStates = ({ 
  className, 
  type, 
  message = "Carregando...",
  size = "md"
}: LoadingStatesProps) => {
  switch (type) {
    case "page":
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="xl" text={message} className={className} />
        </div>
      );
    case "overlay":
      return (
        <LoadingSpinner 
          variant="fullscreen" 
          size={size} 
          text={message} 
          className={className} 
        />
      );
    case "inline":
      return (
        <LoadingSpinner 
          variant="inline" 
          size={size} 
          text={message} 
          className={className} 
        />
      );
    default:
      return (
        <div className="p-8 flex items-center justify-center">
          <LoadingSpinner size={size} text={message} className={className} />
        </div>
      );
  }
};

// Export unificado
export const LoadingSystem = {
  Spinner: LoadingSpinner,
  Skeleton: LoadingSkeleton,
  States: LoadingStates,
};