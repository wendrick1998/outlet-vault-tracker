import { SkeletonLoader, SkeletonPatterns } from "./ui/skeleton-loader";

// Loading components for different sections
export const LoadingStates = {
  Dashboard: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-3">
            <SkeletonLoader height="2rem" width="60%" />
            <SkeletonLoader height="3rem" width="80%" />
            <SkeletonLoader height="1rem" width="40%" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <SkeletonLoader height="2rem" width="30%" />
        <SkeletonPatterns.Table rows={8} cols={5} />
      </div>
    </div>
  ),

  ItemsList: () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SkeletonLoader height="2rem" width="40%" />
        <SkeletonLoader height="2.5rem" width="8rem" />
      </div>
      <SkeletonPatterns.List items={10} />
    </div>
  ),

  ItemDetails: () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <SkeletonLoader variant="circular" width="4rem" height="4rem" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader height="1.5rem" width="60%" />
          <SkeletonLoader height="1rem" width="40%" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonLoader height="1rem" width="30%" />
            <SkeletonLoader height="2rem" width="100%" />
          </div>
        ))}
      </div>
    </div>
  ),

  Form: () => (
    <div className="space-y-4">
      <SkeletonLoader height="1.5rem" width="40%" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonLoader height="1rem" width="25%" />
          <SkeletonLoader height="2.5rem" width="100%" />
        </div>
      ))}
      <div className="flex space-x-2">
        <SkeletonLoader height="2.5rem" width="6rem" />
        <SkeletonLoader height="2.5rem" width="6rem" />
      </div>
    </div>
  ),

  SearchResults: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonLoader height="1.5rem" width="50%" />
        <SkeletonLoader height="1rem" width="20%" />
      </div>
      <SkeletonPatterns.List items={8} />
    </div>
  ),
};