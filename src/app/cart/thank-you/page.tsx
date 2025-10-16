'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Phone } from 'lucide-react'; // Import Phone icon

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [planLabel, setPlanLabel] = useState("Pro Plan");
  const [amountPaid, setAmountPaid] = useState("0.00");

  useEffect(() => {
    const plan = searchParams.get('plan');
    const amount = searchParams.get('amount');

    if (plan === 'monthly') {
      setPlanLabel("Pro Plan (Monthly)");
    } else if (plan === 'threeMonth') {
      setPlanLabel("Pro Plan (3-Month)");
    }

    if (amount) {
      setAmountPaid((parseInt(amount) / 100).toFixed(2));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8"> {/* Adjusted outer container for centering and background */}
      <Card className="max-w-md w-full text-center shadow-lg rounded-lg bg-white dark:bg-gray-800 border-none p-6 mx-auto"> {/* Added w-full for better responsiveness */}
        <CardHeader className="bg-green-50 rounded-t-lg py-6 dark:bg-green-800">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 dark:text-green-300 mb-4" />
          <CardTitle className="text-3xl font-bold text-green-700 dark:text-green-100">Payment Successful!</CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300 mt-2">Thank you for your purchase.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="text-left space-y-2">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Plan Purchased: <span className="font-normal text-gray-700 dark:text-gray-200">{planLabel}</span></p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Amount Paid: <span className="font-normal text-gray-700 dark:text-gray-200">₹{amountPaid}</span></p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 border-t pt-4">Your subscription is active. Remember to renew manually upon expiry to continue uninterrupted service.</p>
          <div className="flex flex-col gap-4 mt-4">
            <Button 
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold transition-colors duration-200"
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/dashboard/account")}
              className="w-full text-gray-700 hover:bg-gray-50 py-3 text-lg transition-colors duration-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-600"
            >
              View My Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer with Support Contact */}
      <footer className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
        <Phone className="h-4 w-4" />
        Need help? Call us at <a href="tel:+911234567890" className="text-blue-600 hover:underline dark:text-blue-400">+91 12345 67890</a>
      </footer>
    </div>
  );
}
