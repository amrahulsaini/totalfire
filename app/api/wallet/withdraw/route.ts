import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import { createUserNotification } from "@/lib/notifications";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const amount = Number(payload.amount);
  const method = (payload.method?.toString() || "manual").slice(0, 30);
  const accountDetails = (payload.accountDetails?.toString() || "").slice(0, 255);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const [wallets] = await pool.query<RowDataPacket[]>("SELECT balance FROM wallets WHERE user_id = ?", [user.id]);
  const balance = wallets.length > 0 ? Number(wallets[0].balance) : 0;

  if (amount > balance) {
    return NextResponse.json({ error: "Amount exceeds wallet balance" }, { status: 400 });
  }

  // Save withdrawal request only. Wallet deduction now happens when admin marks it as deposited.
  await pool.query(
    "INSERT INTO withdrawal_requests (user_id, amount, method, account_details, status) VALUES (?, ?, ?, ?, 'pending')",
    [user.id, amount, method || null, accountDetails || null]
  );

  await createUserNotification({
    userId: user.id,
    type: "withdrawal",
    title: "Withdrawal Requested",
    message: `Your withdrawal request of INR ${amount.toFixed(2)} has been submitted.`,
    payload: { amount, status: "pending" },
  });

  return NextResponse.json({
    success: true,
    message: "Withdrawal request submitted. Balance will be deducted after admin marks it as deposited.",
  });
}
