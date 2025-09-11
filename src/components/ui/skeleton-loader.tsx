import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "default" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function SkeletonLoader({
  className,
  variant = "default",
  width,
  height,
  animation = "pulse",
}: SkeletonLoaderProps) {
  const baseClasses = "bg-muted";
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
  };
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-pulse", // Could be enhanced with custom wave animation
    none: "",
  };

  const style = {
    width: width || "100%",
    height: height || "1rem",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-label="Loading content..."
    />
  );
}

// Pre-built skeleton patterns for common use cases
export const SkeletonPatterns = {
  Card: () => (
    <div className="p-4 space-y-3">
      <SkeletonLoader height="1.5rem" width="70%" />
      <SkeletonLoader height="1rem" width="90%" />
      <SkeletonLoader height="1rem" width="60%" />
    </div>
  ),
  
  List: ({ items = 5 }: { items?: number }) => (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <SkeletonLoader variant="circular" width="2.5rem" height="2.5rem" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader height="1rem" width="80%" />
            <SkeletonLoader height="0.75rem" width="60%" />
          </div>
        </div>
      ))}
    </div>
  ),
  
  Table: ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} height="2rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  ),
};