import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { createUserNotification } from "@/lib/notifications";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ?",
      [decoded.id]
    );
    if (rows.length === 0 || rows[0].role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
}

// POST /api/admin/wallet — set wallet balance for any user (admin only)
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, amount, action } = await request.json();
  // action: "set" | "add" | "deduct"

  if (!username || amount === undefined || !action) {
    return NextResponse.json(
      { error: "username, amount, and action required" },
      { status: 400 }
    );
  }

  const [users] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE username = ?",
    [username.toLowerCase()]
  );

  if (users.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = users[0].id;

  if (action === "set") {
    await pool.query("UPDATE wallets SET balance = ? WHERE user_id = ?", [
      amount,
      userId,
    ]);
  } else if (action === "add") {
    await pool.query(
      "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
      [amount, userId]
    );
  } else if (action === "deduct") {
    await pool.query(
      "UPDATE wallets SET balance = balance - ? WHERE user_id = ?",
      [amount, userId]
    );
  }

  await pool.query(
    "INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
    [
      userId,
      amount,
      action === "deduct" ? "debit" : "credit",
      `Admin ${action}: ₹${amount}`,
    ]
  );

  const [wallets] = await pool.query<RowDataPacket[]>(
    "SELECT balance FROM wallets WHERE user_id = ?",
    [userId]
  );

  await createUserNotification({
    userId,
    type: "wallet",
    title: "Wallet Updated By Admin",
    message: `Admin performed ${action} of INR ${Number(amount).toFixed(2)} on your wallet.`,
    payload: {
      action,
      amount: Number(amount),
      balance: Number(wallets[0].balance),
    },
  });

  return NextResponse.json({
    message: `Wallet ${action} successful`,
    username: username.toLowerCase(),
    balance: Number(wallets[0].balance),
  });
}

// GET /api/admin/wallet?username=xxx — get user wallet info
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    // Return all users with wallet
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.full_name, u.username, u.email, w.balance
       FROM users u LEFT JOIN wallets w ON u.id = w.user_id
       ORDER BY u.created_at DESC`
    );
    return NextResponse.json({ users });
  }

  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.full_name, u.username, u.email, w.balance
     FROM users u LEFT JOIN wallets w ON u.id = w.user_id
     WHERE u.username = ?`,
    [username.toLowerCase()]
  );

  if (users.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: users[0] });
}
