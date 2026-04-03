import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

// GET /api/wallet — get wallet balance
export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [wallets] = await pool.query<RowDataPacket[]>(
    "SELECT balance FROM wallets WHERE user_id = ?",
    [user.id]
  );

  if (wallets.length === 0) {
    // Create wallet if missing
    await pool.query("INSERT INTO wallets (user_id, balance) VALUES (?, 0)", [
      user.id,
    ]);
    return NextResponse.json({ balance: 0 });
  }

  return NextResponse.json({ balance: Number(wallets[0].balance) });
}

// POST /api/wallet — add money (admin set balance for now)
export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await request.json();
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be positive" },
      { status: 400 }
    );
  }

  await pool.query(
    "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
    [amount, user.id]
  );

  await pool.query(
    "INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES (?, ?, 'credit', 'Money added to wallet')",
    [user.id, amount]
  );

  const [wallets] = await pool.query<RowDataPacket[]>(
    "SELECT balance FROM wallets WHERE user_id = ?",
    [user.id]
  );

  return NextResponse.json({
    message: "Money added successfully",
    balance: Number(wallets[0].balance),
  });
}
