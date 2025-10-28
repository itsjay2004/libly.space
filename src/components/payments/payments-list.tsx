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
import { Trash2, Share2, MoreVertical } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

    setPayments([]);
    setPage(0);
    setHasMore(true);
    fetchPayments(0);
    onPaymentDeleted();
    queryClient.invalidateQueries({ queryKey: ['student', studentId] });
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm">Membership Period</TableHead>
              <TableHead className="text-sm">Payment Date</TableHead>
              <TableHead className="text-sm">Pay Method</TableHead>
              <TableHead className="text-sm text-right">Amount</TableHead>
              <TableHead className="text-sm text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && payments.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={5}><Skeleton className="h-8 w-full bg-gray-200 dark:bg-gray-800" /></TableCell>
                </TableRow>
              ))
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id} className="border-b border-gray-200 dark:border-gray-700">
                  <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                    {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM yyyy") : 'N/A'} - 
                    {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(payment.payment_date), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900 dark:text-gray-100">
                    {payment.payment_method || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    ₹{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareReceipt(payment.id)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        aria-label="Share via WhatsApp"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                              This action cannot be undone. This will permanently delete the payment record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(payment.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No payments found for this student.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading && payments.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`mobile-skeleton-${i}`} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800" />
              <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800" />
              <Skeleton className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800" />
            </div>
          ))
        ) : payments.length > 0 ? (
          payments.map((payment) => (
            <div key={payment.id} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₹{payment.amount.toLocaleString()}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                      {payment.payment_method}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paid on {format(new Date(payment.payment_date), "dd MMM yyyy")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
                    <DropdownMenuItem 
                      onClick={() => handleShareReceipt(payment.id)}
                      className="text-blue-600 dark:text-blue-400 cursor-pointer"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Receipt
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(payment.id)}
                      className="text-red-600 dark:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Membership Period */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-muted-foreground">Membership Period</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM yyyy") : 'N/A'} - 
                  {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center h-24 flex items-center justify-center text-muted-foreground border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black">
            No payments found for this student.
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !isLoading && payments.length > 0 && (
        <div className="text-center pt-4">
          <Button 
            onClick={handleLoadMore} 
            variant="outline" 
            className="bg-white dark:bg-black border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Load More
          </Button>
        </div>
      )}

      {isLoading && payments.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Loading more payments...
        </div>
      )}
    </div>
  );
}