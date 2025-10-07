import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <Skeleton className="h-6 w-6 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-6 w-6 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-6 w-6 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-6 w-6 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>

      <div className="grid gap-8">
        <Skeleton className="h-32 w-full" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
