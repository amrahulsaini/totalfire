import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { sendPasswordResetOtpEmail } from "@/lib/mailer";
import {
  PASSWORD_RESET_OTP_EXPIRY_MINUTES,
  generateSixDigitOtp,
  getOtpExpiryDate,
  maskEmail,
} from "@/lib/password-reset";

export const runtime = "nodejs";

type UserRow = RowDataPacket & {
  id: number;
  username: string;
  email: string;
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const username = String(payload.username ?? "").trim().toLowerCase();

  if (!username || username.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(username)) {
    return NextResponse.json(
      { error: "Enter a valid username" },
      { status: 400 }
    );
  }

  const [users] = await pool.query<UserRow[]>(
    `SELECT id, username, email
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username]
  );

  if (users.length === 0) {
    return NextResponse.json({ error: "Username not found" }, { status: 404 });
  }

  const user = users[0];
  const otp = generateSixDigitOtp();
  const otpHash = await bcrypt.hash(otp, 12);
  const expiresAt = getOtpExpiryDate();

  await pool.query(
    `UPDATE password_reset_otps
     SET used_at = NOW()
     WHERE user_id = ? AND used_at IS NULL`,
    [user.id]
  );

  const [insertResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
     VALUES (?, ?, ?)`,
    [user.id, otpHash, expiresAt]
  );

  try {
    await sendPasswordResetOtpEmail({
      to: String(user.email),
      username: String(user.username),
      otp,
      expiresInMinutes: PASSWORD_RESET_OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    await pool.query(
      `UPDATE password_reset_otps
       SET used_at = NOW()
       WHERE id = ?`,
      [insertResult.insertId]
    );

    console.error("Failed to send password reset OTP email:", error);
    return NextResponse.json(
      { error: "Could not send OTP email right now" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "OTP sent to your registered email",
    email: maskEmail(String(user.email)),
    expiresInMinutes: PASSWORD_RESET_OTP_EXPIRY_MINUTES,
  });
}
