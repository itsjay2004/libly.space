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
import { useUser } from '@/hooks/use-user';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchRecentPayments = useCallback(async () => {
    if (!user) return;

    // Keep isLoading true only on the initial fetch, not re-fetches
    // This prevents the whole page from showing a skeleton on refresh
    if (!libraryId) {
        setIsLoading(true);
    }
    setError(null);

    const { data: libraryData, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (libraryError || !libraryData) {
      setError("No library found. Please set one up in settings.");
      setIsLoading(false);
      return;
    }
    
    // Only set libraryId if it's not already set to avoid extra re-renders
    if (!libraryId) {
        setLibraryId(libraryData.id);
    }

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        students ( name )
      `)
      .eq('library_id', libraryData.id)
      .order('payment_date', { ascending: false })
      .limit(10);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      setError("Failed to load recent payments.");
    } else {
      setPayments(paymentsData as PaymentWithStudent[]);
    }
    setIsLoading(false);
  }, [user, supabase, libraryId]); // Added libraryId to dependencies

  useEffect(() => {
    if (!isUserLoading && user) {
      fetchRecentPayments();
    } else if (!isUserLoading && !user) {
      setIsLoading(false);
      setError("Please log in to view payments.");
    }
  }, [isUserLoading, user, fetchRecentPayments]);

  if (isLoading) {
    return <PaymentsPageSkeleton />;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        {libraryId ? (
          // --- FIX: Pass the fetchRecentPayments function as the callback ---
          <AddPaymentForm libraryId={libraryId} onPaymentSuccess={fetchRecentPayments} />
        ) : (
          <Skeleton className="h-96 w-full" />
        )}
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
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.students?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM yyyy") : 'N/A'}
                       - 
                      {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}
                    </TableCell>
                    <TableCell>{format(new Date(payment.payment_date), "dd MMM yyyy")}</TableCell>
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