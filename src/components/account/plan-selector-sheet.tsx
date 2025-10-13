"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PlanSelectorSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelectPro = () => {
    router.push("/dashboard/cart");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Choose your plan</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Up to 50 students</span>
              </div>
              <Button variant="outline" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>
          <Card className="border-purple-500">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Unlimited students</span>
              </div>
              <Button onClick={handleSelectPro}>Select Pro</Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}