import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import { Cashfree } from "cashfree-pg";

// @ts-ignore
Cashfree.XClientId = process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_CASHFREE_APP_ID || "";
// @ts-ignore
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || "";
// @ts-ignore
Cashfree.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
  // @ts-ignore
  ? Cashfree.CFEnvironment.PRODUCTION 
  // @ts-ignore
  : Cashfree.CFEnvironment.SANDBOX;

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const amount = Number(payload.amount);
  const MIN_TOPUP_AMOUNT = 25;
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  if (amount < MIN_TOPUP_AMOUNT) {
    return NextResponse.json(
      { error: `Minimum add money amount is INR ${MIN_TOPUP_AMOUNT}` },
      { status: 400 }
    );
  }

  try {
    const orderId = `ORDER_${user.id}_${Date.now()}`;
    const orderRequest = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: `CUST_${user.id}`,
        customer_phone: (user as any).phone || "9999999999",
        customer_name: (user as any).name || "TotalFire User",
        customer_email: (user as any).email || "user@totalfire.in"
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://totalfire.in'}/game/wallet/verify?order_id={order_id}`
      }
    };

    const response = await Cashfree.PGCreateOrder("2023-08-01", orderRequest);

    return NextResponse.json({
      orderId: response.data.order_id,
      amount: amount,
      currency: "INR",
      paymentUrl: response.data.payment_link || response.data.payment_session_id,
      paymentSessionId: response.data.payment_session_id,
    });
  } catch (error: any) {
    console.error("Cashfree order error:", error?.response?.data || error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

