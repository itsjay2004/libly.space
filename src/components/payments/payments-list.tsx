"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Payment } from "@/lib/types"; // Corrected import statement
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
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
  onPaymentDeleted: () => void; // Callback to refresh the parent page
}

export default function PaymentsList({ payments, onPaymentDeleted }: PaymentsListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const handleDeleteClick = (paymentId: string) => {
    setPaymentToDelete(paymentId);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentToDelete);

    if (error) {
      console.error("Supabase Error deleting payment:", error); // Detailed console log
      toast({ title: "Error", description: `Failed to delete payment: ${error.message || 'Unknown error'}`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Payment record deleted successfully.", variant: "default" });
      onPaymentDeleted(); // Trigger refresh on parent
    }
    setIsDeleting(false);
    setPaymentToDelete(null);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length > 0 ? (payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.for_month}</TableCell>
              <TableCell>{format(new Date(payment.payment_date), "PPP")}</TableCell>
              <TableCell>
                <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
              <TableCell className="text-center">
                <AlertDialog open={paymentToDelete === payment.id} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(payment.id)} disabled={isDeleting}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this payment record.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
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
