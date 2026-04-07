import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import { createUserNotification } from "@/lib/notifications";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const razorpayOrderId =
    payload.razorpay_order_id?.toString() ?? payload.orderId?.toString() ?? "";
  const razorpayPaymentId = payload.razorpay_payment_id?.toString() ?? "";
  const razorpaySignature = payload.razorpay_signature?.toString() ?? "";

  if (!razorpayOrderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.fetch(razorpayOrderId);
    const receipt = order?.receipt?.toString() ?? "";
    if (!receipt.startsWith(`RECPT_${user.id}_`)) {
      return NextResponse.json({ error: "Order does not belong to this user" }, { status: 403 });
    }

    let paymentId = razorpayPaymentId;
    let payment: any;

    if (razorpayPaymentId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }

      payment = await razorpay.payments.fetch(razorpayPaymentId);
      if (!payment || payment.order_id !== razorpayOrderId) {
        return NextResponse.json({ error: "Payment/order mismatch" }, { status: 400 });
      }
    } else {
      const paymentsList = await (razorpay as any).orders.fetchPayments(razorpayOrderId);
      const completedPayment = (paymentsList?.items ?? []).find((item: any) =>
        item?.status === "captured" || item?.status === "authorized"
      );

      if (!completedPayment?.id) {
        return NextResponse.json(
          { error: "Payment not completed yet. Please try again in a few seconds." },
          { status: 202 }
        );
      }

      paymentId = completedPayment.id.toString();
      payment = await razorpay.payments.fetch(paymentId);
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM wallet_transactions WHERE reference_id = ? AND type = 'credit' LIMIT 1",
      [paymentId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: "Payment already verified", status: "SUCCESS" });
    }

    const amountDeposited = Number(payment?.amount) / 100;
    if (!Number.isFinite(amountDeposited) || amountDeposited <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    await pool.query(
      "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
      [amountDeposited, user.id]
    );
    await pool.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'credit', 'Razorpay Wallet Top-up', ?)",
      [user.id, amountDeposited, paymentId]
    );

    await createUserNotification({
      userId: user.id,
      type: "wallet",
      title: "Wallet Top-up Successful",
      message: `INR ${amountDeposited.toFixed(2)} was added to your wallet successfully.`,
      payload: {
        amount: amountDeposited,
        paymentId,
        orderId: razorpayOrderId,
      },
    });

    return NextResponse.json({ status: "SUCCESS", message: "Payment verified and wallet credited" });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
