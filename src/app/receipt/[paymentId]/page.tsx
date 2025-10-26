
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { FullLogoSm as Logo } from '@/components/logo';
import { Armchair, Clock, CalendarCheck2, CreditCard } from 'lucide-react';

// This interface now matches the structure returned by our RPC function.
interface ReceiptData {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  membership_start_date: string | null;
  membership_end_date: string | null;
  library_name: string | null;
  student_name: string | null;
  seat_number: string | null;
  shift_name: string | null;
  shift_start_time: string | null;
  shift_end_time: string | null;
}

// Helper function to format 24-hour time string to AM/PM format
const formatTime = (timeString: string | null): string => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const revalidate = 0;

export default async function ReceiptPage({ params }: { params: { paymentId: string } }) {
  const supabase = createClient();

  // Use the secure RPC function to fetch receipt details.
  const { data: receiptData, error } = await supabase
    .rpc('get_receipt_details', { p_payment_id: params.paymentId })
    .single();

  if (error || !receiptData) {
    if (error) {
      console.error("Supabase RPC Error fetching receipt data:", error);
    }
    if (!receiptData) {
      console.log("Payment not found via RPC for ID:", params.paymentId);
    }
    notFound();
  }

  const libraryName = receiptData.library_name || 'Your Library';
  const studentName = receiptData.student_name || 'Valued Student';
  const studentSeatNumber = receiptData.seat_number || 'N/A';
  const studentShiftName = receiptData.shift_name || 'N/A';

  // Use the new formatTime function to display shift timing
  const studentShiftTime = receiptData.shift_start_time && receiptData.shift_end_time
    ? `${formatTime(receiptData.shift_start_time)} - ${formatTime(receiptData.shift_end_time)}`
    : 'N/A';

  const formattedPaymentDate = format(new Date(receiptData.payment_date), 'dd MMM yyyy');
  const formattedMembershipStart = receiptData.membership_start_date ? format(new Date(receiptData.membership_start_date), 'dd MMM yyyy') : 'N/A';
  const formattedMembershipEnd = receiptData.membership_end_date ? format(new Date(receiptData.membership_end_date), 'dd MMM yyyy') : 'N/A';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-lg mx-auto overflow-hidden rounded-xl shadow-2xl relative bg-white dark:bg-gray-800">
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />

        <CardHeader className="text-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="6" height="6" viewBox="0 0 6 6" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.4" fill-rule="evenodd"%3E%3Cpath d="M5 0h1L0 6V5zM6 5v1H5z"/%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="relative z-10">
            <CardTitle className="text-3xl font-extrabold tracking-tight">{libraryName}</CardTitle>
            <p className="text-md text-indigo-100 mt-1">Payment Receipt</p>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 text-base text-gray-800 dark:text-gray-200">
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Student Name</h3>
              <p className="font-medium">{studentName}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Receipt ID</h3>
              <p className="font-mono text-sm inline-block px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-200">{receiptData.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="col-span-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Membership Period</h3>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                <CalendarCheck2 className="h-5 w-5" />
                <span>{formattedMembershipStart} - {formattedMembershipEnd}</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Seat Number</h3>
              <div className="flex items-center gap-2">
                <Armchair className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">{studentSeatNumber}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Shift</h3>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">
                  <span className='block'>{studentShiftName}</span>
                  <span className='block'>({studentShiftTime})</span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center my-6">
            <div className="absolute inset-y-0 left-0 w-4 h-full bg-gray-100 dark:bg-gray-950 rounded-r-full -ml-2" />
            <div className="absolute inset-y-0 right-0 w-4 h-full bg-gray-100 dark:bg-gray-950 rounded-l-full -mr-2" />
            <div className="border-t border-dashed border-gray-300 dark:border-gray-700 w-full mx-4" />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Payment Details</h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Payment Date:</span>
                </div>
                <span className="font-medium">{formattedPaymentDate}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Payment Method:</span>
                </div>
                <Badge variant="outline" className="font-medium text-sm border border-gray-700 dark:border-gray-500">{receiptData.payment_method || 'N/A'}</Badge>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-2xl font-bold text-indigo-700 dark:text-indigo-300 pt-2">
              <div className="flex items-center gap-2">
                
                <span>Total Paid:</span>
              </div>
              <span>₹{receiptData.amount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col item-center text-center text-xs text-muted-foreground py-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="w-full">Thank you for your payment!</p>
          <p className="w-full mt-1">This is an electronically generated receipt and does not require a signature.</p>
          
          {/* Powered by Logo */}
          <div className="w-full flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Powered by</span>
            <Logo className="h-5 w-auto text-muted-foreground" /> 
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
