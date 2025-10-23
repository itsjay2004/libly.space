'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AddPaymentForm from '@/components/payments/add-payment-form';
import type { PaymentWithStudent } from "@/lib/types";
import { useSharedUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';

export default function PaymentsPage() {
  const { user, libraryId, isLoading: isUserContextLoading } = useSharedUser();
  const supabase = createClient();

  const fetchRecentPayments = useCallback(async () => {
    if (!libraryId) {
      // This case should ideally be handled by `enabled: !!libraryId`
      // but as a fallback, return an empty array if somehow called without libraryId
      return [];
    }

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        students ( name )
      `)
      .eq('library_id', libraryId)
      .order('payment_date', { ascending: false })
      .limit(10);

    if (paymentsError) {
      throw paymentsError;
    }
    return paymentsData as PaymentWithStudent[];
  }, [libraryId, supabase]);

  const { data: payments = [], isLoading, isError, error, refetch } = useQuery<PaymentWithStudent[], Error>({
    queryKey: ['payments', libraryId],
    queryFn: fetchRecentPayments,
    enabled: !!user && !!libraryId, // Only fetch if user and libraryId are available
    staleTime: 1000 * 30, // 30 seconds stale time for recent payments
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time
  });

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

  // Handle errors from the query itself
  if (isError) {
    return <p className="text-center text-red-500">Error loading recent payments: {error?.message}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        {/* AddPaymentForm will invalidate queries on success, triggering a refetch here */}
        <AddPaymentForm libraryId={libraryId} />
      </div>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>The last 10 payments recorded in your library.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Membership Period</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Pay Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton rows while payments are loading
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.students?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM") : 'N/A'} - {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM") : 'N/A'}
                    </TableCell>
                    <TableCell>{format(new Date(payment.payment_date), "dd MMM yy")}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No recent payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
