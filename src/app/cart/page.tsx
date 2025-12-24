'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Footer from "@/components/footer"
import Script from 'next/script';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';



const plans = {
  monthly: {
    amount: 29900, // in paise (299 INR)
    currency: "INR",
    label: "Monthly",
    priceText: "₹299/month",
    totalPrice: 299,
    duration: { months: 1 },
  },
  threeMonth: {
    amount: 75000, // in paise (750 INR)
    currency: "INR",
    label: "3-Month Plan",
    priceText: "₹250/month",
    totalPrice: 750,
    duration: { months: 3 },
  },
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ProcessingOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-center">
    <Loader2 className="animate-spin text-white h-12 w-12 mb-4" />
    <p className="text-white text-lg">Processing payment...</p>
    <p className="text-white text-sm mt-2">Please do not refresh or close the page.</p>
  </div>
);

export default function CartPage() {
  useEffect(() => {
    document.title = `Cart - Libly Space`;
  }, [])

  const router = useRouter();
  const { user, userDetails } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'threeMonth'>('threeMonth');
  const [isProcessing, setIsProcessing] = useState(false);

  const { currentExpiry, newExpiry } = useMemo(() => {
    const today = new Date();
    let baseDate = today;

    const currentSubEnd = userDetails?.subscription_end_date ? new Date(userDetails.subscription_end_date) : null;

    if (currentSubEnd && currentSubEnd > today) {
      baseDate = currentSubEnd;
    }

    const planDuration = plans[selectedPlan].duration;
    const nextExpiry = new Date(baseDate);
    nextExpiry.setMonth(nextExpiry.getMonth() + planDuration.months);

    return {
      currentExpiry: currentSubEnd ? format(currentSubEnd, 'PPP') : 'N/A',
      newExpiry: format(nextExpiry, 'PPP'),
    };
  }, [selectedPlan, userDetails?.subscription_end_date]);


  const handlePayment = async () => {
    setIsProcessing(true);
    NProgress.start();

    const planDetails = plans[selectedPlan];

    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: planDetails.amount,
        currency: planDetails.currency,
      }),
    });

    const { order } = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Libly.space",
      description: `Libly Pro - ${planDetails.label}`,
      order_id: order.id,
      handler: async function (response: any) {
        const verificationRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...response,
            user_id: user?.id,
            plan: selectedPlan,
          }),
        });

        const verificationData = await verificationRes.json();
        if (verificationData.success) {
          router.push(`/cart/thank-you?plan=${selectedPlan}&amount=${planDetails.amount}&txn_id=${verificationData.paymentId}`);
        } else {
          alert("Payment verification failed. Please contact support@ 9142992036");
        }
        setIsProcessing(false);
        NProgress.done();
      },
      prefill: {
        name: userDetails?.full_name,
        email: user?.email,
        contact: userDetails?.phone,
      },
      notes: {
        address: "Libly WebApp",
      },
      theme: {
        color: "#0062ff",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', function (response: any) {
      alert(response.error.description);
      setIsProcessing(false);
      NProgress.done();
    });

    rzp1.open();
  };

  const total = plans[selectedPlan].totalPrice;

  return (
    <div className='min-h-screen flex flex-col justify-between'>
      {isProcessing && <ProcessingOverlay />}
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <Breadcrumbs className="mb-4" />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8">Your cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border shadow-sm rounded-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Libly Pro Plan</h2>
                <div className="mt-6 space-y-4">
                  {/* Monthly Plan */}
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all",
                      selectedPlan === 'monthly' ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center">
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4", selectedPlan === 'monthly' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300')}>
                        {selectedPlan === 'monthly' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">Monthly</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Renews at ₹299.00/mo.</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="text-lg font-semibold text-gray-900 dark:text-white">₹299.00/month</p></div>
                  </div>
                  {/* 3-Month Plan */}
                  <div
                    onClick={() => setSelectedPlan('threeMonth')}
                    className={cn("relative flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all", selectedPlan === 'threeMonth' ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600')}
                  >
                    <div className="absolute top-0 right-4 -mt-3"><div className="inline-block bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">SAVE ₹147</div></div>
                    <div className="flex items-center">
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4", selectedPlan === 'threeMonth' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300')}>
                        {selectedPlan === 'threeMonth' && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">3-Month Plan</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">One-time payment of ₹750.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">₹250.00/month</p>
                      <p className="text-sm text-gray-400 line-through">₹299.00</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="border shadow-sm rounded-lg">
              <CardHeader><CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Order summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span>Current Expiry</span>
                  <span>{currentExpiry}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                  <span>{plans[selectedPlan].label}</span>
                  <span>₹{plans[selectedPlan].totalPrice.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <div className="flex justify-between items-center font-bold text-lg text-gray-900 dark:text-white">
                  <span className='text-base'>Plan Valid Until:</span>
                  <span className='text-xs font-medium border border-indigo-600 rounded-sm p-1'>{newExpiry}</span>
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 py-3 mt-4 rounded-lg font-semibold"
                >
                  {isProcessing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
                </Button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">15-day money-back guarantee</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
}
