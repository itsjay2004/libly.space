import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PaymentsList from '@/components/payments/payments-list';
import ClientAddPaymentFormForPaymentsPage from '@/components/payments/client-add-payment-form-for-payments-page';

export default async function PaymentsPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Please log in to view payments.</p>;
  }

  const { data: libraryData, error: libraryError } = await supabase
    .from('libraries')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (libraryError || !libraryData) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">No Library Found</h2>
          <p className="mb-4">Please set up your library in the settings to manage payments.</p>
          <Button asChild>
              <Link href="/dashboard/settings">Go to Settings</Link>
          </Button>
      </div>
    );
  }

  // Fetch payments for the library
  const { data: payments, error: paymentsError } = await supabase
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
    return <p>Error loading payments.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ClientAddPaymentFormForPaymentsPage libraryId={libraryData.id} />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Last 10 payments recorded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.students?.name || 'N/A'}</TableCell>
                    <TableCell>{payment.for_month}</TableCell>
                    <TableCell>{format(new Date(payment.payment_date), "PPP")}</TableCell>
                    <TableCell className="text-right">₹{payment.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No recent payments.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
