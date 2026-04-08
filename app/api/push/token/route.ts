import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import pool from "@/lib/db";

function normalizePlatform(value: unknown): "android" | "ios" | "web" {
  const platform = String(value ?? "").toLowerCase();
  if (platform === "ios") {
    return "ios";
  }
  if (platform === "web") {
    return "web";
  }
  return "android";
}

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const fcmToken = String(payload.fcmToken ?? "").trim();
  const platform = normalizePlatform(payload.platform);
  const deviceId = String(payload.deviceId ?? "").trim().slice(0, 120) || null;
  const appVersion =
    String(payload.appVersion ?? "").trim().slice(0, 40) || null;

  if (!fcmToken) {
    return NextResponse.json({ error: "Missing fcmToken" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO user_push_tokens
      (user_id, platform, fcm_token, device_id, app_version, is_active, last_seen_at)
     VALUES (?, ?, ?, ?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       platform = VALUES(platform),
       device_id = VALUES(device_id),
       app_version = VALUES(app_version),
       is_active = 1,
       last_seen_at = NOW(),
       updated_at = NOW()`,
    [user.id, platform, fcmToken, deviceId, appVersion]
  );

  await pool.query(
    `INSERT INTO user_notification_preferences (user_id)
     VALUES (?)
     ON DUPLICATE KEY UPDATE user_id = user_id`,
    [user.id]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const fcmToken = String(payload.fcmToken ?? "").trim();
  if (!fcmToken) {
    return NextResponse.json({ error: "Missing fcmToken" }, { status: 400 });
  }

  await pool.query(
    "UPDATE user_push_tokens SET is_active = 0 WHERE user_id = ? AND fcm_token = ?",
    [user.id, fcmToken]
  );

  return NextResponse.json({ success: true });
}
