import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import { createUserNotification } from "@/lib/notifications";
import type { RowDataPacket } from "mysql2";
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
  const cashfreeOrderId =
    payload.order_id?.toString() ?? payload.orderId?.toString() ?? payload.Cashfree_order_id?.toString() ?? "";

  if (!cashfreeOrderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const response = await Cashfree.PGOrderFetchPayments("2023-08-01", cashfreeOrderId);
    const paymentsList = response.data;

    // Find a successful payment
    const completedPayment = paymentsList.find((item: any) =>
      item?.payment_status === "SUCCESS"
    );

    if (!completedPayment) {
      return NextResponse.json(
        { error: "Payment not completed yet or failed. Please try again in a few seconds." },
        { status: 202 }
      );
    }

    const paymentId = completedPayment.cf_payment_id?.toString() || completedPayment.payment_group_details?.cf_payment_id?.toString();

    if (!paymentId) {
      return NextResponse.json({ error: "Could not retrieve valid payment ID" }, { status: 400 });
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM wallet_transactions WHERE reference_id = ? AND type = 'credit' LIMIT 1",
      [paymentId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: "Payment already verified", status: "SUCCESS" });
    }

    const amountDeposited = Number(completedPayment.payment_amount);
    if (!Number.isFinite(amountDeposited) || amountDeposited <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    await pool.query(
      "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
      [amountDeposited, user.id]
    );
    await pool.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'credit', 'Cashfree Wallet Top-up', ?)",
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
        orderId: cashfreeOrderId,
      },
    });

    return NextResponse.json({ message: "Payment verified successfully", status: "SUCCESS" });
  } catch (error: any) {
    console.error("Cashfree verification error:", error?.response?.data || error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
