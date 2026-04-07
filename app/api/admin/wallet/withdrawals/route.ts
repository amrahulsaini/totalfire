import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import pool from "@/lib/db";
import { createUserNotification } from "@/lib/notifications";
import type { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
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
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const { id, action } = payload;
  if (!id || !action) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

  const [reqs] = await pool.query<RowDataPacket[]>(
    "SELECT id, user_id, amount, status FROM withdrawal_requests WHERE id = ? LIMIT 1",
    [id]
  );

  if (reqs.length === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const requestRow = reqs[0];
  const userId = Number(requestRow.user_id);
  const amount = Number(requestRow.amount);
  const currentStatus = String(requestRow.status);

  if (action === "approve") {
    if (currentStatus !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be approved" }, { status: 400 });
    }

    await pool.query(
      "UPDATE withdrawal_requests SET status = 'approved', processed_by = ?, processed_at = NOW() WHERE id = ?",
      [admin.id, id]
    );

    await createUserNotification({
      userId,
      type: "withdrawal",
      title: "Withdrawal Approved",
      message: `Your withdrawal request of INR ${amount.toFixed(2)} is approved.`,
      payload: { withdrawalId: Number(id), status: "approved", amount },
    });
  } else if (action === "reject") {
    if (currentStatus === "deposited") {
      return NextResponse.json({ error: "Deposited requests cannot be rejected" }, { status: 400 });
    }

    await pool.query(
      "UPDATE withdrawal_requests SET status = 'rejected', processed_by = ?, processed_at = NOW() WHERE id = ?",
      [admin.id, id]
    );

    await createUserNotification({
      userId,
      type: "withdrawal",
      title: "Withdrawal Rejected",
      message: `Your withdrawal request of INR ${amount.toFixed(2)} was rejected by admin.`,
      payload: { withdrawalId: Number(id), status: "rejected", amount },
    });
  } else if (action === "deposit") {
    if (currentStatus !== "approved") {
      return NextResponse.json(
        { error: "Only approved requests can be marked as deposited" },
        { status: 400 }
      );
    }

    const referenceId = `WDR-${id}`;
    const [existingTx] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM wallet_transactions WHERE reference_id = ? AND type = 'debit' LIMIT 1",
      [referenceId]
    );
    if (existingTx.length > 0) {
      return NextResponse.json({ error: "This request is already deposited" }, { status: 409 });
    }

    const [walletRows] = await pool.query<RowDataPacket[]>(
      "SELECT balance FROM wallets WHERE user_id = ? LIMIT 1",
      [userId]
    );
    const balance = walletRows.length > 0 ? Number(walletRows[0].balance) : 0;
    if (balance < amount) {
      return NextResponse.json(
        { error: "User wallet has insufficient balance for this withdrawal." },
        { status: 400 }
      );
    }

    await pool.query("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [
      amount,
      userId,
    ]);
    await pool.query(
      "INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id) VALUES (?, ?, 'debit', 'Withdrawal Deposited', ?)",
      [userId, amount, referenceId]
    );
    await pool.query(
      "UPDATE withdrawal_requests SET status = 'deposited', processed_by = ?, processed_at = NOW() WHERE id = ?",
      [admin.id, id]
    );

    await createUserNotification({
      userId,
      type: "wallet",
      title: "Withdrawal Deposited",
      message: `INR ${amount.toFixed(2)} has been sent to your account. Wallet balance updated.`,
      payload: { withdrawalId: Number(id), status: "deposited", amount },
    });
  } else {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
