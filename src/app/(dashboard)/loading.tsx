import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayoutLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden sm:flex w-64 flex-col border-r p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
