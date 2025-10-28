"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddPaymentForm from "@/components/payments/add-payment-form";
import { CircleDollarSign } from "lucide-react";

interface QuickAddPaymentProps {
  libraryId: string;
  onPaymentSuccess?: () => void;
}

export default function QuickAddPayment({ libraryId, onPaymentSuccess }: QuickAddPaymentProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false); // Close the dialog on success
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CircleDollarSign className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-transparent dark:bg-transparent border border-transparent">
        {/* The AddPaymentForm component already has a Card, Title, etc. */}
        <div className="">
          <AddPaymentForm libraryId={libraryId} onPaymentSuccexss={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
