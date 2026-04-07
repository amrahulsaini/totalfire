import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = Number(id);
  if (!notificationId || notificationId <= 0) {
    return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const isRead = payload.isRead === false ? 0 : 1;

  const [result] = await pool.query(
    "UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?",
    [isRead, notificationId, user.id]
  );

  const updateResult = result as { affectedRows?: number };
  if (!updateResult.affectedRows) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = Number(id);
  if (!notificationId || notificationId <= 0) {
    return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
  }

  const [result] = await pool.query(
    "DELETE FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, user.id]
  );

  const deleteResult = result as { affectedRows?: number };
  if (!deleteResult.affectedRows) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
