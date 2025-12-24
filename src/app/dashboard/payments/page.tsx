'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AddPaymentForm from '@/components/payments/add-payment-form';
import { useSharedUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import RecentPaymentsTable from '@/components/payments/recent-payments-table';
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PaymentsPage() {
  const { user, libraryId, isUserLoading: isUserContextLoading } = useSharedUser();

  useEffect(() => {
    document.title = `Payment - Libly Space`;
  }, [])

  // Check if initial user context is still loading
  if (isUserContextLoading) {
    return <PaymentsPageSkeleton />;
  }

  // Check if user is not logged in after context loads
  if (!user) {
    return <p className="text-center text-red-500">Please log in to view payments.</p>;
  }

  // Check if libraryId is not available after context loads
  if (!libraryId) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">No Library Found</h2>
        <p className="mb-4">Please set up your library in the settings to manage payments.</p>
        <Button asChild>
          <Link href="/dashboard/library">Go to Library Settings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="w-full max-w-xl mx-auto">
        {/* AddPaymentForm will invalidate queries on success, triggering a refetch here */}
        <AddPaymentForm libraryId={libraryId} />
      </div>

      <div className="w-full">
        <RecentPaymentsTable libraryId={libraryId} />
      </div>
    </div>
  );
}

const PaymentsPageSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div className="w-full max-w-xl mx-auto">
      <Skeleton className="h-[400px] w-full" />
    </div>
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);
