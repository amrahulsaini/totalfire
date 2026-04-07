import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, original_amount } = payload;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const amountDeposited = Number(original_amount);

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
