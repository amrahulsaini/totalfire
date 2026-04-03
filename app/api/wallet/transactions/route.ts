import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

// GET /api/wallet/transactions — get wallet transaction history
export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [transactions] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [user.id]
  );

  return NextResponse.json({ transactions });
}
