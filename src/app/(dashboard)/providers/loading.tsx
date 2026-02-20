import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProvidersLoading() {
  return (
    <div className="space-y-6">
      {/* Page header with action button */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-36" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Provider list items */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
