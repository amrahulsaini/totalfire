import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import { createUserNotification } from "@/lib/notifications";
import type { RowDataPacket } from "mysql2";

function normalizeUpiId(value: unknown) {
  return String(value ?? "").trim().toLowerCase().slice(0, 80);
}

function isValidUpiId(upiId: string) {
  return /^[a-z0-9._-]{2,}@[a-z]{2,}$/.test(upiId);
}

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const amount = Number(payload.amount);
  const upiId = normalizeUpiId(payload.upiId ?? payload.accountDetails);
  const MIN_WITHDRAW_AMOUNT = 75;

  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  if (amount < MIN_WITHDRAW_AMOUNT) {
    return NextResponse.json(
      { error: `Minimum withdrawal amount is INR ${MIN_WITHDRAW_AMOUNT}` },
      { status: 400 }
    );
  }
  if (!isValidUpiId(upiId)) {
    return NextResponse.json({ error: "Valid UPI ID is required" }, { status: 400 });
  }

  const [wallets] = await pool.query<RowDataPacket[]>("SELECT balance FROM wallets WHERE user_id = ?", [user.id]);
  const balance = wallets.length > 0 ? Number(wallets[0].balance) : 0;

  if (amount > balance) {
    return NextResponse.json({ error: "Amount exceeds wallet balance" }, { status: 400 });
  }

  // Save withdrawal request only. Wallet deduction now happens when admin marks it as deposited.
  await pool.query(
    `INSERT INTO user_upi_accounts (user_id, upi_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE upi_id = VALUES(upi_id), updated_at = CURRENT_TIMESTAMP`,
    [user.id, upiId]
  );

  await pool.query(
    "INSERT INTO withdrawal_requests (user_id, amount, method, account_details, upi_id, status) VALUES (?, ?, 'upi', ?, ?, 'pending')",
    [user.id, amount, upiId, upiId]
  );

  await createUserNotification({
    userId: user.id,
    type: "withdrawal",
    title: "Withdrawal Requested",
    message: `Your withdrawal request of INR ${amount.toFixed(2)} has been submitted for UPI ${upiId}.`,
    payload: { amount, status: "pending", upiId },
  });

  return NextResponse.json({
    success: true,
    message: "Withdrawal request submitted. Balance will be deducted after admin marks it as deposited.",
  });
}
