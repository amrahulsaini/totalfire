import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth.isAuthenticated || auth.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [transactions] = await pool.query<RowDataPacket[]>(`
      SELECT wt.*, u.full_name, u.email 
      FROM wallet_transactions wt
      JOIN users u ON wt.user_id = u.id
      ORDER BY wt.created_at DESC
    `);
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
