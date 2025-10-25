'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Trash2, Share2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface PaymentData {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  library_id: string;
  membership_start_date: string;
  membership_end_date: string;
  payment_method: string;
  students?: {
    phone: string;
  };
}

interface PaymentsListProps {
  studentId: string;
  studentName: string;
  libraryName: string;
  onPaymentDeleted: () => void;
}

const PAYMENTS_PER_PAGE = 10;

export default function PaymentsList({ studentId, studentName, libraryName, onPaymentDeleted }: PaymentsListProps) {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [phone, setPhone] = useState<string>('');
  const supabase = createClient();
  const queryClient = useQueryClient();

  const fetchPayments = useCallback(async (pageIndex: number) => {
    setIsLoading(true);
    const from = pageIndex * PAYMENTS_PER_PAGE;
    const to = from + PAYMENTS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        students ( phone )
      `)
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false })
      .range(from, to) as { data: PaymentData[] | null; error: any };

    if (error) {
      console.error('Error fetching payments:', error);
      toast({ title: "Error", description: "Failed to fetch payments.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (data) {
      // ✅ Store student's phone from the first record (if available)
      if (data.length > 0 && data[0].students?.phone) {
        setPhone(data[0].students.phone);
      }

      setPayments(prev => pageIndex === 0 ? data : [...prev, ...data]);
      if (data.length < PAYMENTS_PER_PAGE) {
        setHasMore(false);
      }
    }

    setIsLoading(false);
  }, [studentId, supabase]);

  useEffect(() => {
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

  const handleShareReceipt = (paymentId: string) => {
    if (!phone) {
      toast({ title: "Missing Phone Number", description: "This student has no phone number available.", variant: "destructive" });
      return;
    }

    if (typeof window !== 'undefined') {
      const receiptUrl = `${window.location.origin}/receipt/${paymentId}`;
      const message = `Dear ${studentName},\n\nHere is your payment receipt from ${libraryName}:\n${receiptUrl}`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');
      toast({ title: "Opening WhatsApp", description: "Ready to share the receipt link." });
    } else {
      toast({ title: "Error", description: "Cannot share from a server environment.", variant: "destructive" });
    }
  };

  const handleDelete = async (paymentId: string) => {
    const { error: deleteError } = await supabase.from('payments').delete().eq('id', paymentId);

    if (deleteError) {
      toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Payment deleted successfully." });

    const { data: latestRemainingPayment, error: fetchLatestPaymentError } = await supabase
      .from('payments')
      .select('membership_end_date')
      .eq('student_id', studentId)
      .order('membership_end_date', { ascending: false })
      .limit(1)
      .single();

    if (fetchLatestPaymentError && fetchLatestPaymentError.code !== 'PGRST116') {
      console.error("Error fetching latest payment:", fetchLatestPaymentError);
    }

    const newExpiryDate = latestRemainingPayment?.membership_end_date || null;

    const { error: updateStudentError } = await supabase
      .from('students')
      .update({ membership_expiry_date: newExpiryDate })
      .eq('id', studentId);

    if (updateStudentError) {
      toast({ title: "Error", description: "Failed to update student's expiry date.", variant: "destructive" });
    }

    // Refresh list
    setPayments([]);
    setPage(0);
    setHasMore(true);
    fetchPayments(0);
    onPaymentDeleted();
    queryClient.invalidateQueries({ queryKey: ['student', studentId] });
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membership Period</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Pay Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Share</TableHead>
            <TableHead className="text-right">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && payments.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ))
          ) : payments.length > 0 ? (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM yyyy") : 'N/A'} - 
                  {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}
                </TableCell>
                <TableCell>{format(new Date(payment.payment_date), "dd MMM yyyy")}</TableCell>
                <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShareReceipt(payment.id)}
                    aria-label="Share via WhatsApp"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TableCell>
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
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                No payments found for this student.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {hasMore && !isLoading && payments.length > 0 && (
        <div className="text-center">
          <Button onClick={handleLoadMore} variant="outline">Load More</Button>
        </div>
      )}

      {isLoading && payments.length > 0 && (
        <div className="text-center"><p>Loading more payments...</p></div>
      )}
    </div>
  );
}
