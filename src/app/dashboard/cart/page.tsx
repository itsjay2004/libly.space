'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";

const plans = {
  monthly: {
    amount: 1000, // in paise (10 INR)
    currency: "INR",
  },
  yearly: {
    amount: 10000, // in paise (100 INR)
    currency: "INR",
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

  const handleChoosePlan = async (duration: "monthly" | "yearly") => {
    const plan = plans[duration];

    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plan),
    });

    const { order } = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Acme Corp",
      description: "Pro Plan Subscription",
      order_id: order.id,
      handler: async function (response: any) {
        const verificationRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...response,
            user_id: user?.id,
            plan: duration,
          }),
        });

        const verificationData = await verificationRes.json();

        if (verificationData.success) {
          alert("Payment successful! Your subscription has been updated.");
          router.push("/dashboard/account");
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
        address: "Acme Corp HQ",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.open();
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Pro Plan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold">Choose your billing cycle</h3>
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-semibold">Monthly</p>
                <p className="text-gray-500">₹10/month</p>
              </div>
              <Button onClick={() => handleChoosePlan("monthly")}>
                Choose Monthly
              </Button>
            </div>
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-semibold">Yearly</p>
                <p className="text-gray-500">₹100/year (Save 20%)</p>
              </div>
              <Button onClick={() => handleChoosePlan("yearly")}>
                Choose Yearly
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
