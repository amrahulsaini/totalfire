import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in rupees * 100 for paise
      currency: "INR",
      receipt: `RECPT_${user.id}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    let paymentUrl: string | null = null;
    try {
      const paymentLink = await (razorpay as any).paymentLink.create({
        amount: order.amount,
        currency: order.currency,
        accept_partial: false,
        reference_id: order.id,
        description: "Total Fire Wallet Top-up",
      });
      paymentUrl = paymentLink?.short_url ?? paymentLink?.shortUrl ?? null;
    } catch {
      // Payment link is best-effort for web fallback.
      paymentUrl = null;
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentUrl,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
