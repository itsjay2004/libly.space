"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";
import NProgress from "nprogress";

export default function PlanSelectorSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleUpgrade = () => {
    NProgress.start();
    router.push("/cart");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-3xl lg:max-w-4xl bg-background border-l flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-2xl font-semibold">Choose Your Plan</SheetTitle>
          <SheetDescription>
            Unlock unlimited potential and saves 100s of hours.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col sm:flex-row gap-6 justify-between">
            {/* Free Plan */}
            <Card className="flex-1 border border-muted bg-muted/30 hover:bg-muted/40 transition">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-left">Free Plan</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-left">
                <p className="text-3xl font-bold">
                  ₹0<span className="text-base font-normal">/mo</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  For small study halls & libraries
                </p>

                <div className="mt-3 space-y-2">
                  <Feature text="Up to 50 students" />
                  <Feature text="Student management" />
                  <Feature text="Student records" />
                  <Feature text="Real-time seat management" />
                  <Feature text="Payment tracking" />
                  <Feature text="Membership management" />
                  <Feature text="Invoice generation" />
                  <Feature text="WhatsApp receipt sharing" />
                  <Feature text="Multiple shift management" />
                  <Feature text="Powerful Dashboard" />
                  <Feature text="Basic reporting" />
                  <Feature text="Email support" />
                </div>

                <Button variant="outline" className="mt-6 w-full" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="flex-1 border-2 border-primary bg-primary/5 hover:bg-primary/10 transition">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-left">Pro Plan</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-between gap-3 text-left">
                <div>
                  <p className="text-3xl font-bold">
                    ₹299<span className="text-base font-normal">/mo</span>
                  </p>
                  <div className="bg-primary/10 text-primary text-sm rounded-lg px-3 py-2 w-fit shadow-md">
                    ₹250/mo (3-month Plan) — Save 16%
                  </div>
                  <p className="border-2 border-primary/20 rounded-md p-2 text-sm font-medium mt-2">Everything in Free, plus:</p>

                  <div className="mt-3 space-y-2">
                    <Feature text="Unlimited students" />
                    <Feature text="Comprehensive reports & analytics" />
                    <Feature text="Data export & backup" />
                    <Feature text="Custom data import" />
                    <Feature text="Advanced reporting" />
                    <Feature text="Priority 24/7 support" />
                  </div>
                </div>
                <Button onClick={handleUpgrade} className="mt-6 w-full">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Check className="w-4 h-4 mt-[2px] text-primary flex-shrink-0" />
      <span className="leading-snug">{text}</span>
    </div>
  );
}
