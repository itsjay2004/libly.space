'use client';

import { useEffect, useState, useCallback } from 'react';
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
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        {/* AddPaymentForm will invalidate queries on success, triggering a refetch here */}
        <AddPaymentForm libraryId={libraryId} />
      </div>

      <RecentPaymentsTable libraryId={libraryId} />
    </div>
  );
}

const PaymentsPageSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-1">
      <Skeleton className="h-96 w-full" />
    </div>
    <Card className="lg:col-span-2">
      <CardHeader>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);
