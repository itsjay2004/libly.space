"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NProgress from 'nprogress';

export function PlanSelectorSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelectPro = () => {
    NProgress.start(); // Start NProgress
    router.push("/cart");
    setOpen(false);
  };

  const commonFeatures = [
    "Realtime seat allocation",
    "Student management",
    "Individual student profile",
    "Payment recording",
    "Advanced due calculation",
    "Powerful dashboard",
    "Due reminder",
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-none md:w-1/2 lg:w-1/2"> {/* Adjusted width */}
        <SheetHeader>
          <SheetTitle>Upgrade Your Experience</SheetTitle> {/* Updated title */}
        </SheetHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
          <Card className="flex flex-col"> {/* Add flex-col to Card */}
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for individuals getting started.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow gap-4 justify-between"> {/* Add flex-grow and justify-between */}
              <div>
                <p className="text-2xl font-bold text-gray-900">Free</p>
                <div className="flex items-center gap-2 mt-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Up to 50 students</span>
                </div>
                <div className="space-y-2"> {/* Added space-y-2 for vertical spacing */}
                  {commonFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" disabled className="w-full">
                Current Plan
              </Button>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-500 shadow-lg relative flex flex-col"> {/* Add flex-col to Card */}
             <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full">Recommended</Badge>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Unlock unlimited potential for your growing needs.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow gap-4 justify-between"> {/* Add flex-grow and justify-between */}
              <div>
                <p className="text-2xl font-bold text-gray-900">Rs 299<span className="text-base font-normal">/month</span></p>
                <p className="text-sm text-gray-600">Billed monthly, with savings on 3-month plans.</p>
                <div className="flex items-center gap-2 mt-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Unlimited students</span>
                </div>
                <div className="space-y-2"> {/* Added space-y-2 for vertical spacing */}
                  {commonFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2"> {/* Added mt-2 for space between common and priority support */}
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Priority Support</span>
                </div>
              </div>
              <Button onClick={handleSelectPro} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                Select Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}