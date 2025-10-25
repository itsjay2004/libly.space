import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      user_id,
      plan,
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const supabase = createClient();

      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("subscription_end_date")
        .eq("id", user_id)
        .single();

      if (userError) {
        throw userError;
      }

      let baseDate = new Date();

      if (user.subscription_end_date) {
        const existingEndDate = new Date(user.subscription_end_date);
        if (existingEndDate > baseDate) {
          baseDate = existingEndDate;
        }
      }

      const newSubscriptionEndDate = new Date(baseDate);

      if (plan === "monthly") {
        newSubscriptionEndDate.setMonth(newSubscriptionEndDate.getMonth() + 1);
      } else if (plan === "threeMonth") {
        newSubscriptionEndDate.setMonth(newSubscriptionEndDate.getMonth() + 3);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_end_date: newSubscriptionEndDate.toISOString(),
        })
        .eq("id", user_id);

      if (updateError) {
        throw updateError;
      }

      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert([
          {
            user_id,
            razorpay_payment_id,
            razorpay_subscription_id: razorpay_order_id,
            razorpay_signature,
            plan,
            status: "active",
            start_date: baseDate.toISOString(), // FIX: Use the calculated baseDate as the start_date
            end_date: newSubscriptionEndDate.toISOString(),
          },
        ]);

      if (subscriptionError) {
        throw subscriptionError;
      }

      return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
    } else {
      return NextResponse.json({ success: false }, { status: 400 });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { error: "Failed to verify Razorpay payment" },
      { status: 500 }
    );
  }
}
