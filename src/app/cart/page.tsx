'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { cn } from '@/lib/utils'; // Assuming `cn` utility exists
import { CheckCircle2 } from 'lucide-react'; // Import CheckCircle2

const plans = {
  monthly: {
    amount: 29900, // in paise (299 INR)
    currency: "INR",
    label: "Monthly",
    priceText: "₹299/month",
    description: "One-time payment for 1 month", // Updated description
    effectivePrice: 299,
    billingPeriodMonths: 1,
  },
  threeMonth: {
    amount: 75000, // in paise (250 INR * 3 months = 750 INR)
    currency: "INR",
    label: "3-Month Plan",
    priceText: "₹250/month",
    description: "One-time payment of ₹750 for 3 months", // Updated description
    effectivePrice: 250, // Effective monthly price for display
    billingPeriodMonths: 3,
  },
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CartPage() {
  const router = useRouter();
  const { user, userDetails } = useUser();

  const [selectedPlanDuration, setSelectedPlanDuration] = useState<'monthly' | 'threeMonth' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const selectedPlan = selectedPlanDuration ? plans[selectedPlanDuration] : null;

  const monthlyCostForThreeMonths = plans.monthly.amount * 3;
  const threeMonthPlanTotalCost = plans.threeMonth.amount;
  const discountAmount = selectedPlanDuration === 'threeMonth' ? (monthlyCostForThreeMonths - threeMonthPlanTotalCost) / 100 : 0;

  useEffect(() => {
    // NProgress is controlled directly by handleInitiatePayment and Razorpay callbacks.
  }, []);

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;

    NProgress.start();
    setIsProcessingPayment(true);

    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: selectedPlan.amount,
        currency: selectedPlan.currency,
      }),
    });

    const { order } = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "libly.space",
      description: `Pro Plan Subscription (${selectedPlan.label})`, // Dynamic description
      order_id: order.id,
      handler: async function (response: any) {
        NProgress.done();
        setIsProcessingPayment(false);

        const verificationRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...response,
            user_id: user?.id,
            plan: selectedPlanDuration,
          }),
        });

        const verificationData = await verificationRes.json();

        if (verificationData.success) {
          // Redirect to the new thank-you page with plan details
          router.push(`/cart/thank-you?plan=${selectedPlanDuration}&amount=${selectedPlan.amount}`);
        } else {
          alert("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: userDetails?.full_name,
        email: user?.email,
        contact: userDetails?.phone,
      },
      notes: {
        address: "Libly Space",
      },
      theme: {
        color: "#0062ff",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', function (response: any) {
      NProgress.done();
      setIsProcessingPayment(false);
      alert(`Payment failed: ${response.error.description || 'Unknown error'}`);
    });
    rzp1.open();
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-gray-100">Your Cart</h1>
      <Card className="max-w-xl mx-auto shadow-lg rounded-lg border-none bg-white dark:bg-gray-800">
        <CardHeader className="bg-gray-50 rounded-t-lg py-6 dark:bg-gray-900">
          <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center">Complete Your Pro Plan Subscription</CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-300 mt-2">Choose your billing cycle to proceed with a one-time payment.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Plan Card */}
            <div
              className={cn(
                "relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200",
                "bg-white dark:bg-gray-700",
                selectedPlanDuration === "monthly" 
                  ? "border-blue-600 ring-2 ring-blue-600 shadow-md"
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
              )}
              onClick={() => setSelectedPlanDuration("monthly")}
            >
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{plans.monthly.label}</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{plans.monthly.priceText}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{plans.monthly.description}</p>
              {selectedPlanDuration === "monthly" && (
                <CheckCircle2 className="absolute top-3 right-3 h-6 w-6 text-blue-600" />
              )}
            </div>

            {/* 3-Month Plan Card */}
            <div
              className={cn(
                "relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200",
                "bg-white dark:bg-gray-700",
                selectedPlanDuration === "threeMonth" 
                  ? "border-blue-600 ring-2 ring-blue-600 shadow-md"
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
              )}
              onClick={() => setSelectedPlanDuration("threeMonth")}
            >
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs">Save ₹{discountAmount.toFixed(2)}!</Badge>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{plans.threeMonth.label}</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{plans.threeMonth.priceText}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{plans.threeMonth.description}</p>
              {selectedPlanDuration === "threeMonth" && (
                <CheckCircle2 className="absolute top-3 right-3 h-6 w-6 text-blue-600" />
              )}
            </div>
          </div>

          {selectedPlan && (
            <div className="grid gap-4 border-t pt-6 mt-4 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Order Summary</h3>
              <div className="flex justify-between text-gray-700 dark:text-gray-200">
                <span>Pro Plan ({selectedPlan.label})</span>
                <span>₹{(selectedPlan.effectivePrice * selectedPlan.billingPeriodMonths).toFixed(2)}</span>
              </div>
              {selectedPlanDuration === 'threeMonth' && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100 border-t pt-4 dark:border-gray-700">
                <span>Total Due Today</span>
                <span>₹{(selectedPlan.amount / 100).toFixed(2)}</span>
              </div>
              <Button
                onClick={handleInitiatePayment}
                disabled={isProcessingPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold transition-colors duration-200"
              >
                {isProcessingPayment ? "Processing Payment..." : `Confirm & Pay ₹${(selectedPlan.amount / 100).toFixed(2)}`}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => selectedPlanDuration ? setSelectedPlanDuration(null) : router.back()}
            className="w-full text-gray-700 hover:bg-gray-50 py-3 text-lg transition-colors duration-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-600"
          >
            {selectedPlanDuration ? "Change Plan" : "Go Back"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
