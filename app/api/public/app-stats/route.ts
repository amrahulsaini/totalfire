import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

const ACTIVE_WINDOW_DAYS = 30;

type StatsRow = RowDataPacket & {
  active_users: number | string | null;
  downloads: number | string | null;
};

function buildResponse(activeUsers: number, downloads: number) {
  return NextResponse.json(
    {
      activeUsers,
      downloads,
      activeWindowDays: ACTIVE_WINDOW_DAYS,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

export async function GET() {
  try {
    const [rows] = await pool.query<StatsRow[]>(
      `SELECT
         (
           SELECT COUNT(DISTINCT te.user_id)
           FROM tournament_entries te
           WHERE te.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         ) AS active_users,
         (
           SELECT COUNT(*)
           FROM users u
           WHERE u.role = 'user'
         ) AS downloads`,
      [ACTIVE_WINDOW_DAYS]
    );

    return buildResponse(
      Number(rows[0]?.active_users ?? 0),
      Number(rows[0]?.downloads ?? 0)
    );
  } catch {
    return buildResponse(0, 0);
  }
}
