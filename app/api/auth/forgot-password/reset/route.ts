import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { isStrongPassword } from "@/lib/password-reset";

export const runtime = "nodejs";

type ResetTokenPayload = {
  purpose: string;
  userId: number;
  otpId: number;
  iat?: number;
  exp?: number;
};

type OtpStateRow = RowDataPacket & {
  id: number;
  user_id: number;
  verified_at: string | null;
  used_at: string | null;
  expires_at: string;
};

function isExpired(value: string) {
  const expiresAt = new Date(value).getTime();
  if (!Number.isFinite(expiresAt)) {
    return true;
  }
  return expiresAt <= Date.now();
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const resetToken = String(payload.resetToken ?? "").trim();
  const newPassword = String(payload.newPassword ?? "");

  if (!resetToken) {
    return NextResponse.json(
      { error: "Reset token is required" },
      { status: 400 }
    );
  }

  if (!isStrongPassword(newPassword)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters with one uppercase letter and one number",
      },
      { status: 400 }
    );
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Server is missing JWT configuration" },
      { status: 500 }
    );
  }

  let decoded: ResetTokenPayload;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET) as ResetTokenPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 401 }
    );
  }

  if (
    decoded.purpose !== "password_reset" ||
    !Number.isFinite(Number(decoded.userId)) ||
    !Number.isFinite(Number(decoded.otpId))
  ) {
    return NextResponse.json(
      { error: "Invalid reset token" },
      { status: 401 }
    );
  }

  const [rows] = await pool.query<OtpStateRow[]>(
    `SELECT id, user_id, verified_at, used_at, expires_at
     FROM password_reset_otps
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [Number(decoded.otpId), Number(decoded.userId)]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Invalid reset request" },
      { status: 400 }
    );
  }

  const otpState = rows[0];

  if (otpState.used_at) {
    return NextResponse.json(
      { error: "This reset request was already used" },
      { status: 400 }
    );
  }

  if (!otpState.verified_at) {
    return NextResponse.json(
      { error: "OTP verification is required first" },
      { status: 400 }
    );
  }

  if (isExpired(String(otpState.expires_at))) {
    await pool.query(
      `UPDATE password_reset_otps
       SET used_at = NOW()
       WHERE id = ?`,
      [otpState.id]
    );

    return NextResponse.json(
      { error: "OTP expired. Request a new OTP" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    `UPDATE users
     SET password = ?
     WHERE id = ?`,
    [passwordHash, Number(decoded.userId)]
  );

  await pool.query(
    `UPDATE password_reset_otps
     SET used_at = NOW()
     WHERE id = ?`,
    [otpState.id]
  );

  await pool.query(
    `UPDATE password_reset_otps
     SET used_at = NOW()
     WHERE user_id = ? AND used_at IS NULL`,
    [Number(decoded.userId)]
  );

  return NextResponse.json({
    message: "Password updated successfully. Please log in with the new password",
  });
}
