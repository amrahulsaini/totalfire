import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const [wallets] = await pool.query<RowDataPacket[]>("SELECT balance FROM wallets WHERE user_id = ?", [user.id]);
  const balance = wallets.length > 0 ? Number(wallets[0].balance) : 0;

  if (amount > balance) {
    return NextResponse.json({ error: "Amount exceeds wallet balance" }, { status: 400 });
  }

  // Deduct from wallet and append to withdrawal_requests
  await pool.query("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [amount, user.id]);
  
  await pool.query("INSERT INTO withdrawal_requests (user_id, amount, status) VALUES (?, ?, 'pending')", [user.id, amount]);

  await pool.query(
    "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'debit', 'Withdrawal Request', ?)",
    [user.id, amount, `REQ-${Date.now()}`]
  );

  return NextResponse.json({ success: true, message: "Withdrawal requested." });    
}
