import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [withdrawals] = await pool.query<RowDataPacket[]>(
    `SELECT id, amount, method, account_details, upi_id, status, processed_at, admin_note, created_at, updated_at
     FROM withdrawal_requests
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 100`,
    [user.id]
  );

  return NextResponse.json({ withdrawals });
}
