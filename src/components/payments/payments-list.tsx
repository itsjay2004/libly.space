'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Payment } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface PaymentsListProps {
  studentId: string;
  onPaymentDeleted: () => void;
}

const PAYMENTS_PER_PAGE = 10;

export default function PaymentsList({ studentId, onPaymentDeleted }: PaymentsListProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();

  const fetchPayments = useCallback(async (pageIndex: number) => {
    setIsLoading(true);
    const from = pageIndex * PAYMENTS_PER_PAGE;
    const to = from + PAYMENTS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching payments:', error);
      toast({ title: "Error", description: "Failed to fetch payments.", variant: "destructive" });
    } else {
      setPayments(prev => pageIndex === 0 ? data : [...prev, ...data]);
      if (data.length < PAYMENTS_PER_PAGE) {
        setHasMore(false);
      }
    }
    setIsLoading(false);
  }, [studentId, supabase]);

  useEffect(() => {
    // Initial fetch
    setPayments([]);
    setPage(0);
    setHasMore(true);
    fetchPayments(0);
  }, [fetchPayments, studentId]);
  
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPayments(nextPage);
  };

  const handleDelete = async (paymentId: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Payment deleted successfully." });
      // Reset and refetch to ensure consistency
      setPayments([]);
      setPage(0);
      setHasMore(true);
      fetchPayments(0);
      // Notify parent component (e.g., to update membership status)
      onPaymentDeleted();
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membership Period</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && payments.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ))
          ) : payments.length > 0 ? (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM yyyy") : 'N/A'}
                   - 
                  {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}
                </TableCell>
                <TableCell>{format(new Date(payment.payment_date), "dd MMM yyyy")}</TableCell>
                <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the payment record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(payment.id)}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                No payments found for this student.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {hasMore && !isLoading && (
        <div className="text-center">
          <Button onClick={handleLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}
      {isLoading && payments.length > 0 && (
         <div className="text-center">
            <p>Loading...</p>
         </div>
      )}
    </div>
  );
}
