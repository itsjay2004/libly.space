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
        .select("*")
        .eq("id", user_id)
        .single();

      if (userError) {
        throw userError;
      }

      const subscription_end_date = new Date();
      if (plan === "monthly") {
        subscription_end_date.setMonth(subscription_end_date.getMonth() + 1);
      } else if (plan === "yearly") {
        subscription_end_date.setFullYear(
          subscription_end_date.getFullYear() + 1
        );
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_end_date: subscription_end_date.toISOString(),
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
            razorpay_subscription_id: razorpay_order_id, // Using order_id as subscription_id for simplicity
            razorpay_signature,
            plan,
            status: "active",
            start_date: new Date().toISOString(),
            end_date: subscription_end_date.toISOString(),
          },
        ]);

      if (subscriptionError) {
        throw subscriptionError;
      }

      return NextResponse.json({ success: true });
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
