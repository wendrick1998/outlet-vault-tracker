import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const TableRowSkeleton = () => (
  <tr className="border-b">
    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
    <td className="p-4"><Skeleton className="h-4 w-28" /></td>
    <td className="p-4"><Skeleton className="h-4 w-16" /></td>
    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
  </tr>
);

export const ItemCardSkeleton = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      <Skeleton className="h-10 w-full" />
    </div>
  </Card>
);

export const StatCardSkeleton = () => (
  <div className="bg-card rounded-lg p-4 shadow-soft">
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-4 w-20" />
  </div>
);

export const FormSkeleton = () => (
  <Card className="p-6">
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  </Card>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
      <Card className="p-6">
        <Skeleton className="h-6 w-28 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
    
    {/* Recent activity */}
    <Card className="p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-48 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  </div>
);