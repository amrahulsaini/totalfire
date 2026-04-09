import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type LeaderRow = RowDataPacket & {
  username: string;
  game_name: string | null;
  total_earnings: number | string | null;
  total_kills: number | string | null;
};

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "");
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  const whole = Math.trunc(parsed);
  if (whole <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(whole, MAX_LIMIT);
}

// GET /api/leaderboard — top users by earnings (descending)
export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));

  const [rows] = await pool.query<LeaderRow[]>(
    `SELECT
       u.username,
       COALESCE(latest_entry.game_name, '') AS game_name,
       COALESCE(SUM(mr.reward_amount), 0) AS total_earnings,
       COALESCE(SUM(mr.kills), 0) AS total_kills
     FROM users u
     LEFT JOIN match_results mr
       ON mr.user_id = u.id
     LEFT JOIN (
       SELECT te.user_id, te.game_name
       FROM tournament_entries te
       INNER JOIN (
         SELECT user_id, MAX(id) AS latest_id
         FROM tournament_entries
         WHERE game_name IS NOT NULL AND TRIM(game_name) <> ''
         GROUP BY user_id
       ) latest
         ON latest.user_id = te.user_id
        AND latest.latest_id = te.id
     ) latest_entry
       ON latest_entry.user_id = u.id
     WHERE u.role = 'user'
     GROUP BY u.id, u.username, latest_entry.game_name
     ORDER BY total_earnings DESC, total_kills DESC, u.username ASC
     LIMIT ?`,
    [limit]
  );

  const leaders = rows.map((row, index) => ({
    rank: index + 1,
    username: String(row.username ?? ""),
    game_name: String(row.game_name ?? ""),
    total_earnings: Number(row.total_earnings ?? 0),
    total_kills: Number(row.total_kills ?? 0),
  }));

  return NextResponse.json({
    leaders,
    generatedAt: new Date().toISOString(),
  });
}
