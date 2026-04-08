import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { verifyUser } from "@/lib/auth";
import pool from "@/lib/db";

const SUPPORTED_LANGUAGES = new Set(["en", "hi"]);

type SupportedLanguage = "en" | "hi";

function normalizeLanguage(value: unknown): SupportedLanguage {
  const parsed = String(value ?? "").trim().toLowerCase();
  return parsed === "hi" ? "hi" : "en";
}

export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT language_code
     FROM user_app_settings
     WHERE user_id = ?
     LIMIT 1`,
    [user.id]
  );

  const language = normalizeLanguage(rows[0]?.language_code);
  return NextResponse.json({ language });
}

export async function PUT(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const language = String(payload.language ?? "").trim().toLowerCase();

  if (!SUPPORTED_LANGUAGES.has(language)) {
    return NextResponse.json(
      { error: "Invalid language. Supported values: en, hi" },
      { status: 400 }
    );
  }

  await pool.query(
    `INSERT INTO user_app_settings (user_id, language_code)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       language_code = VALUES(language_code),
       updated_at = CURRENT_TIMESTAMP`,
    [user.id, language]
  );

  return NextResponse.json({ success: true, language });
}
