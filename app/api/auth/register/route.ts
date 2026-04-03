import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, username, email, mobile, password } = body;

    if (!fullName || !username || !email || !mobile || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3+ chars, only letters, numbers, dots, underscores" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Mobile number must be 10 digits" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE username = ? OR email = ? OR mobile = ?",
      [username.toLowerCase(), email.toLowerCase(), mobile]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username, email, or mobile already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (full_name, username, email, mobile, password)
       VALUES (?, ?, ?, ?, ?)`,
      [fullName.trim(), username.toLowerCase(), email.toLowerCase(), mobile, hashedPassword]
    );

    // Wallet is created automatically by the after_user_insert trigger

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: result.insertId,
          fullName: fullName.trim(),
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          mobile,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
