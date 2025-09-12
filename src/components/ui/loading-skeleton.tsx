import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  showAvatar?: boolean;
}

export const LoadingSkeleton = ({ 
  className, 
  rows = 3, 
  showAvatar = false 
}: LoadingSkeletonProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          {showAvatar && (
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted"></div>
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      ))}
    </div>
  );
};