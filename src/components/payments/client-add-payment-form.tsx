"use client";

import AddPaymentForm from "./add-payment-form";

export default function ClientAddPaymentForm({ studentId, libraryId }: { studentId: string; libraryId: string }) {
  return <AddPaymentForm studentId={studentId} libraryId={libraryId} onPaymentSuccess={() => window.location.reload()} />;
}
