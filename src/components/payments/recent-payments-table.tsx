'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format, parseISO, max } from "date-fns";
import { createClient } from '@/lib/supabase/client';
import type { PaymentWithStudent } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface RecentPaymentsTableProps {
  libraryId: string;
}

const PAGE_SIZE = 15;

export default function RecentPaymentsTable({ libraryId }: RecentPaymentsTableProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const fetchPayments = useCallback(async (currentPage: number) => {
    if (!libraryId) {
      return { payments: [], count: 0 };
    }

    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const { data: paymentsData, error: paymentsError, count } = await supabase
      .from('payments')
      .select(`
        *,
        students ( name )
      `, { count: 'exact' })
      .eq('library_id', libraryId)
      .order('payment_date', { ascending: false })
      .range(start, end);

    if (paymentsError) {
      throw paymentsError;
    }
    return { payments: paymentsData as PaymentWithStudent[], count: count || 0 };
  }, [libraryId, supabase]);

  const { data, isLoading, isError, error, refetch } = useQuery<{
    payments: PaymentWithStudent[];
    count: number;
  }, Error>({
    queryKey: ['allPayments', libraryId, page],
    queryFn: () => fetchPayments(page),
    enabled: !!libraryId,
    staleTime: 1000 * 30, // 30 seconds stale time
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time
  });

  const payments = data?.payments || [];
  const totalPayments = data?.count || 0;
  const totalPages = Math.ceil(totalPayments / PAGE_SIZE);

  const handleShareReceipt = (paymentId: string) => {
    // Placeholder for sharing receipt logic
    console.log(`Sharing receipt for payment ID: ${paymentId}`);
    alert(`Share receipt for payment ID: ${paymentId}`);
  };

  const handleDeletePayment = async (paymentId: string, studentId: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) {
      return;
    }

    // 1. Delete the payment record
    const { error: deleteError } = await supabase.from('payments').delete().eq('id', paymentId);

    if (deleteError) {
      console.error("Error deleting payment:", deleteError);
      alert("Failed to delete payment.");
      return;
    }

    alert("Payment deleted successfully.");

    // 2. Fetch the latest remaining payment for the student
    const { data: latestRemainingPayment, error: fetchLatestPaymentError } = await supabase
      .from('payments')
      .select('membership_end_date')
      .eq('student_id', studentId)
      .order('membership_end_date', { ascending: false })
      .limit(1)
      .single(); // Use .single() to get a single object or null

    if (fetchLatestPaymentError && fetchLatestPaymentError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Error fetching latest remaining payment for student:", fetchLatestPaymentError);
      queryClient.invalidateQueries({ queryKey: ['allPayments', libraryId, page] });
      return;
    }

    // 3. Determine the new membership_expiry_date
    const newExpiryDate = latestRemainingPayment?.membership_end_date || null;

    // 4. Update the students table with the new membership_expiry_date
    const { error: updateStudentError } = await supabase
      .from('students')
      .update({ membership_expiry_date: newExpiryDate })
      .eq('id', studentId);

    if (updateStudentError) {
      console.error("Error updating student's membership expiry date:", updateStudentError);
      alert("Failed to update student's membership expiry date.");
    }

    // 5. Invalidate queries to ensure UI reflects changes
    queryClient.invalidateQueries({ queryKey: ['allPayments', libraryId, page] });
    queryClient.invalidateQueries({ queryKey: ['student', studentId] }); // Invalidate specific student query if exists
  };

  if (isError) {
    return <p className="text-center text-red-500">Error loading payments: {error?.message}</p>;
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>All Payments</CardTitle>
        <CardDescription>All payments recorded in your library, with pagination.</CardDescription>
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
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
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
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleShareReceipt(payment.id)}>
                          Share Receipt
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePayment(payment.id, payment.student_id)}
                          className="text-red-600">
                          Delete Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-4">
          <Button
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0 || isLoading}
            variant="outline"
          >
            Previous
          </Button>
          <span>Page {page + 1} of {totalPages === 0 ? 1 : totalPages}</span>
          <Button
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page + 1 >= totalPages || isLoading}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
