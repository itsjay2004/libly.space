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
import { MoreHorizontal, Share2, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface RecentPaymentsTableProps {
  libraryId: string;
}

const PAGE_SIZE = 15;

export default function RecentPaymentsTable({ libraryId }: RecentPaymentsTableProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
        students ( name, phone )
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
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  const payments = data?.payments || [];
  const totalPayments = data?.count || 0;
  const totalPages = Math.ceil(totalPayments / PAGE_SIZE);

  const handleShareReceipt = (payment: PaymentWithStudent) => {
    const studentPhone = payment.students?.phone;
    const studentName = payment.students?.name || 'Student';
     
    if (!studentPhone) {
      toast({ 
        title: "Missing Phone Number", 
        description: "This student has no phone number available.", 
        variant: "destructive" 
      });
      return;
    }

    if (typeof window !== 'undefined') {
      // Create receipt URL - adjust this path based on your actual receipt route
      const receiptUrl = `${window.location.origin}/receipt/${payment.id}`;
      
      // Create the message
      const message = `Dear ${studentName},\n\nHere is your payment receipt of ₹${payment.amount.toLocaleString()}\n📅 Payment Date: ${format(new Date(payment.payment_date), "dd MMM yyyy")}\n📋 Membership Period: ${payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM") : 'N/A'} - ${payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}\n\nView your full receipt here:\n${receiptUrl}`;
      
      // Format phone number (remove any non-digit characters)
      const formattedPhone = studentPhone.replace(/\D/g, '');
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      toast({ 
        title: "Opening WhatsApp", 
        description: "Ready to share the receipt link." 
      });
    } else {
      toast({ 
        title: "Error", 
        description: "Cannot share from a server environment.", 
        variant: "destructive" 
      });
    }
  };

  const handleDeletePayment = async (paymentId: string, studentId: string) => {
    if (!confirm("Are you sure you want to delete this payment record?")) {
      return;
    }

    const { error: deleteError } = await supabase.from('payments').delete().eq('id', paymentId);

    if (deleteError) {
      console.error("Error deleting payment:", deleteError);
      toast({
        title: "Failed to delete payment",
        description: "There was an error deleting the payment record.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Payment deleted successfully",
      description: "The payment record has been removed.",
    });

    const { data: latestRemainingPayment, error: fetchLatestPaymentError } = await supabase
      .from('payments')
      .select('membership_end_date')
      .eq('student_id', studentId)
      .order('membership_end_date', { ascending: false })
      .limit(1)
      .single();

    if (fetchLatestPaymentError && fetchLatestPaymentError.code !== 'PGRST116') {
      console.error("Error fetching latest remaining payment for student:", fetchLatestPaymentError);
      queryClient.invalidateQueries({ queryKey: ['allPayments', libraryId, page] });
      return;
    }

    const newExpiryDate = latestRemainingPayment?.membership_end_date || null;

    const { error: updateStudentError } = await supabase
      .from('students')
      .update({ membership_expiry_date: newExpiryDate })
      .eq('id', studentId);

    if (updateStudentError) {
      console.error("Error updating student's membership expiry date:", updateStudentError);
      toast({
        title: "Failed to update student's membership expiry date.",
        description: "There was an error updating the student's membership expiry date.",
        variant: "destructive"
      });
    }

    queryClient.invalidateQueries({ queryKey: ['allPayments', libraryId, page] });
    queryClient.invalidateQueries({ queryKey: ['student', studentId] });
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
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Membership Period</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Pay Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.students?.phone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM") : 'N/A'} - {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}
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
                          <DropdownMenuItem 
                            onClick={() => handleShareReceipt(payment)}
                            className="flex items-center gap-2"
                          >
                            <Share2 className="h-4 w-4" />
                            Share via WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePayment(payment.id, payment.student_id)}
                            className="text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={`mobile-skeleton-${i}`} className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </Card>
            ))
          ) : payments.length > 0 ? (
            payments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{payment.students?.name || 'N/A'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {payment.students?.phone || 'No phone'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.payment_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {payment.payment_method}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Membership Period</p>
                    <p className="font-medium">
                      {payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM") : 'N/A'} - 
                      {payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShareReceipt(payment)}
                    className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    disabled={!payment.students?.phone}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePayment(payment.id, payment.student_id)}
                    className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No payments found.</p>
            </Card>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {payments.length} of {totalPayments} payments
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0 || isLoading}
              variant="outline"
              size="sm"
              className="px-3 py-2"
            >
              Previous
            </Button>
            <span className="text-sm min-w-[100px] text-center">
              Page {page + 1} of {totalPages === 0 ? 1 : totalPages}
            </span>
            <Button
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={page + 1 >= totalPages || isLoading}
              variant="outline"
              size="sm"
              className="px-3 py-2"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}