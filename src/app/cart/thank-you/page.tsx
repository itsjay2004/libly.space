'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Download, ArrowRight, Mail, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Logo from '@/components/logo';

// Helper function to format the date
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ThankYouPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [planLabel, setPlanLabel] = useState("Pro Plan");
  const [amountPaid, setAmountPaid] = useState("0.00");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");
  const [transactionId, setTransactionId] = useState("N/A"); // Example transaction ID

  useEffect(() => {
    const plan = searchParams.get('plan');
    const amount = searchParams.get('amount');
    const txn_id = searchParams.get('txn_id');

    if (txn_id) {
      setTransactionId(txn_id);
    }

    const startDate = new Date();
    setSubscriptionStartDate(formatDate(startDate));

    if (plan === 'monthly') {
      setPlanLabel("Pro Plan (Monthly)");
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      setSubscriptionEndDate(formatDate(endDate));

    } else if (plan === 'threeMonth') {
      setPlanLabel("Pro Plan (3-Month)");
       const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 3);
      setSubscriptionEndDate(formatDate(endDate));
    }

    if (amount) {
      setAmountPaid((parseInt(amount) / 100).toFixed(2));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <Logo />
            </div>
            <Card className="w-full shadow-lg rounded-xl border-t-4 border-green-500">
                <CardHeader className="text-center p-8">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">Thank You for Your Order!</CardTitle>
                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                        Your payment was successful and your subscription is now active.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Order Summary */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Order Summary</h3>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{planLabel}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">₹{amountPaid}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{transactionId}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex justify-between py-2">
                                    <span className="text-blue-700 dark:text-blue-300">Subscription Starts:</span>
                                    <span className="font-medium text-blue-800 dark:text-blue-200">{subscriptionStartDate}</span>
                                </div>
                                <Separator className="bg-blue-200 dark:bg-blue-800"/>
                                <div className="flex justify-between py-2">
                                    <span className="text-blue-700 dark:text-blue-300">Next Renewal Date:</span>
                                    <span className="font-medium text-blue-800 dark:text-blue-200">{subscriptionEndDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Next Steps & Benefits */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What's Next?</h3>
                                <Button onClick={() => router.push('/dashboard')} className="w-full justify-between items-center text-lg py-6 bg-indigo-600 hover:bg-indigo-700">
                                    <span>Go to Your Dashboard</span>
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between items-center text-lg py-6 mt-3">
                                    <span>Download Invoice</span>
                                    <Download className="h-5 w-5" />
                                </Button>
                            </div>
                             <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pro Plan Benefits</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li>Manage unlimited students</li>
                                    <li>Advanced reporting and analytics</li>
                                    <li>Priority email and phone support</li>
                                    <li>Access to all new features</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <footer className="text-center mt-8 text-gray-600 dark:text-gray-400">
                <p>If you have any questions, contact our support team.</p>
                <div className="flex justify-center items-center gap-6 mt-4">
                    <a href="mailto:support@libly.space" className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400">
                        <Mail className="h-5 w-5" />
                        support@libly.space
                    </a>
                    <a href="tel:+911234567890" className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400">
                        <Phone className="h-5 w-5" />
                        +91 12345 67890
                    </a>
                </div>
            </footer>
        </div>
    </div>
  );
}
