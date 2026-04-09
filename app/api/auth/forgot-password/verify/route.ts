import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export const runtime = "nodejs";

type OtpRow = RowDataPacket & {
  id: number;
  user_id: number;
  otp_hash: string;
  attempts: number;
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
  const username = String(payload.username ?? "").trim().toLowerCase();
  const otp = String(payload.otp ?? "").trim();

  if (!username || username.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(username)) {
    return NextResponse.json(
      { error: "Enter a valid username" },
      { status: 400 }
    );
  }

  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: "OTP must be 6 digits" }, { status: 400 });
  }

  const [rows] = await pool.query<OtpRow[]>(
    `SELECT
       pro.id,
       pro.user_id,
       pro.otp_hash,
       pro.attempts,
       pro.expires_at
     FROM password_reset_otps pro
     INNER JOIN users u ON u.id = pro.user_id
     WHERE u.username = ?
       AND pro.used_at IS NULL
       AND pro.verified_at IS NULL
     ORDER BY pro.id DESC
     LIMIT 1`,
    [username]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Request OTP first" },
      { status: 400 }
    );
  }

  const currentOtp = rows[0];

  if (isExpired(String(currentOtp.expires_at))) {
    await pool.query(
      `UPDATE password_reset_otps
       SET used_at = NOW()
       WHERE id = ?`,
      [currentOtp.id]
    );

    return NextResponse.json(
      { error: "OTP expired. Request a new one" },
      { status: 400 }
    );
  }

  const isValidOtp = await bcrypt.compare(otp, String(currentOtp.otp_hash));
  if (!isValidOtp) {
    const nextAttempts = Number(currentOtp.attempts) + 1;

    if (nextAttempts >= 5) {
      await pool.query(
        `UPDATE password_reset_otps
         SET attempts = ?, used_at = NOW()
         WHERE id = ?`,
        [nextAttempts, currentOtp.id]
      );

      return NextResponse.json(
        { error: "OTP failed too many times. Request a new OTP" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE password_reset_otps
       SET attempts = ?
       WHERE id = ?`,
      [nextAttempts, currentOtp.id]
    );

    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  await pool.query(
    `UPDATE password_reset_otps
     SET verified_at = NOW()
     WHERE id = ?`,
    [currentOtp.id]
  );

  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Server is missing JWT configuration" },
      { status: 500 }
    );
  }

  const resetToken = jwt.sign(
    {
      purpose: "password_reset",
      userId: Number(currentOtp.user_id),
      otpId: Number(currentOtp.id),
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return NextResponse.json({
    message: "OTP verified. You can now reset password",
    resetToken,
  });
}
