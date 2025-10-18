"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Payment } from "@/lib/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useState } from "react";
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
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentsListProps {
  payments: Payment[];
  onPaymentDeleted: () => void;
}

export default function PaymentsList({ payments, onPaymentDeleted }: PaymentsListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);

    // 1. Delete the payment record
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentToDelete.id);

    if (deleteError) {
      toast({ title: "Error", description: `Failed to delete payment: ${deleteError.message}`, variant: "destructive" });
      setIsDeleting(false);
      return;
    }

    // 2. Find the latest remaining payment for the student
    const { data: latestPayment, error: fetchError } = await supabase
      .from('payments')
      .select('membership_end_date')
      .eq('student_id', paymentToDelete.student_id)
      .order('membership_end_date', { ascending: false })
      .limit(1)
      .single();
    
    // 3. Update the student's membership expiry date
    const newExpiryDate = fetchError ? null : latestPayment?.membership_end_date;

    const { error: updateError } = await supabase
      .from('students')
      .update({ membership_expiry_date: newExpiryDate })
      .eq('id', paymentToDelete.student_id);

    if (updateError) {
      toast({ 
        title: "Warning: Partial Success", 
        description: `Payment was deleted, but failed to update the student's expiry date. Please review the student's profile. Error: ${updateError.message}`, 
        variant: "destructive",
        duration: 8000
      });
    } else {
      toast({ title: "Success", description: "Payment deleted and student membership updated." });
    }
    
    onPaymentDeleted();
    setIsDeleting(false);
    setPaymentToDelete(null);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment Date</TableHead>
            <TableHead>Membership Start</TableHead>
            <TableHead>Membership End</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length > 0 ? (payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{format(new Date(payment.payment_date), "dd MMM yyyy")}</TableCell>
              <TableCell>{payment.membership_start_date ? format(new Date(payment.membership_start_date), "dd MMM yyyy") : 'N/A'}</TableCell>
              <TableCell>{payment.membership_end_date ? format(new Date(payment.membership_end_date), "dd MMM yyyy") : 'N/A'}</TableCell>
              <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
              <TableCell className="text-center">
                <AlertDialog open={paymentToDelete?.id === payment.id} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(payment)} disabled={isDeleting}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete the payment and recalculate the student's membership expiry date based on their remaining payments. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting} onClick={() => setPaymentToDelete(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Confirm Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No payment history available.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
