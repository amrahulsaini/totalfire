import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth.isAuthenticated || auth.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [withdrawals] = await pool.query<RowDataPacket[]>(`
    SELECT wr.*, u.full_name, u.email 
    FROM withdrawal_requests wr
    JOIN users u ON wr.user_id = u.id
    ORDER BY wr.created_at DESC
  `);
  return NextResponse.json({ success: true, withdrawals });
}

export async function POST(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth.isAuthenticated || auth.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const { id, action } = payload;
  if (!id || !action) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

  if (action === "approve") {
    await pool.query("UPDATE withdrawal_requests SET status = 'approved' WHERE id = ?", [id]);
  } else if (action === "reject") {
    // If rejected, refund the wallet
    const [reqs] = await pool.query<RowDataPacket[]>("SELECT amount, user_id FROM withdrawal_requests WHERE id = ?", [id]);
    if (reqs.length > 0) {
      await pool.query("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [reqs[0].amount, reqs[0].user_id]);
      await pool.query(
        "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'credit', 'Rejected Withdrawal Refund', ?)",
        [reqs[0].user_id, reqs[0].amount, `REFUND-${id}`]
      );
    }
    await pool.query("UPDATE withdrawal_requests SET status = 'rejected' WHERE id = ?", [id]);
  }

  return NextResponse.json({ success: true });
}
