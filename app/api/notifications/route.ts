import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

function parsePayload(payload: unknown) {
  if (payload == null) {
    return null;
  }

  if (typeof payload === "object") {
    return payload;
  }

  if (typeof payload !== "string" || payload.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") || 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.max(1, Math.min(100, Math.floor(rawLimit)))
    : 50;

  const [notifications] = await pool.query<RowDataPacket[]>(
    `SELECT id, type, title, message, payload, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [user.id, limit]
  );

  const [counts] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
    [user.id]
  );

  const items = notifications.map((item) => ({
    ...item,
    is_read: Number(item.is_read) === 1,
    payload: parsePayload(item.payload),
  }));

  return NextResponse.json({
    notifications: items,
    unreadCount: Number(counts[0]?.unread_count ?? 0),
  });
}

export async function PATCH(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  if (payload.markAllRead !== true) {
    return NextResponse.json(
      { error: "markAllRead=true is required" },
      { status: 400 }
    );
  }

  await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [
    user.id,
  ]);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  if (payload.deleteAll !== true) {
    return NextResponse.json(
      { error: "deleteAll=true is required" },
      { status: 400 }
    );
  }

  await pool.query("DELETE FROM notifications WHERE user_id = ?", [user.id]);
  return NextResponse.json({ success: true });
}
