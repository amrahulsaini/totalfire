import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment parameters" }, { status: 400 });
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM wallet_transactions WHERE reference_id = ? AND type = 'credit' LIMIT 1",
    [razorpay_payment_id]
  );

  if (existing.length > 0) {
    return NextResponse.json({ message: "Payment already verified", status: "SUCCESS" });
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const payment = await razorpay.payments.fetch(razorpay_payment_id);
  if (!payment || payment.order_id !== razorpay_order_id) {
    return NextResponse.json({ error: "Payment/order mismatch" }, { status: 400 });
  }

  const amountDeposited = Number(payment.amount) / 100;
  if (!Number.isFinite(amountDeposited) || amountDeposited <= 0) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }

  // Safely credit the wallet
  await pool.query(
    "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
    [amountDeposited, user.id]
  );
  await pool.query(
    "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'credit', 'Razorpay Wallet Top-up', ?)",
    [user.id, amountDeposited, razorpay_payment_id]
  );

  return NextResponse.json({ status: "SUCCESS" });
}
