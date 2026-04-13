import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyUser } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

// GET /api/tournaments/my — get user's tournaments
export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // upcoming, active, completed

  // Auto-transition: move any 'upcoming' tournaments whose start_time has passed to 'active'.
  // Uses DATE_ADD(UTC_TIMESTAMP()) to compare IST-stored times without needing timezone tables.
  await pool.query(
    `UPDATE tournaments SET status = 'active'
     WHERE status = 'upcoming' AND is_active = 1
     AND start_time <= DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE)`
  );

  let query = `
    SELECT
      t.*,
      MIN(te.slot_number) AS slot_number,
      MIN(te.team_number) AS team_number,
      MAX(te.status) AS entry_status,
      COUNT(te.id) AS seats_booked,
      GROUP_CONCAT(te.slot_number ORDER BY te.slot_number ASC) AS slot_numbers,
    (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id = t.id) as current_players
    FROM tournaments t
    JOIN tournament_entries te ON t.id = te.tournament_id
    WHERE te.user_id = ?
  `;
  const params: (string | number)[] = [user.id];

  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }

  query += " GROUP BY t.id";
  query += " ORDER BY t.start_time ASC";

  const [tournaments] = await pool.query<RowDataPacket[]>(query, params);

  // Add room info only in the reveal window: 5 minutes before start to 5 minutes after.
  // NOW() returns IST since session timezone is set to +05:30 in db.ts
  const enriched = await Promise.all(
    tournaments.map(async (t) => {
      const [[{ minFromStart }]] = await pool.query<RowDataPacket[]>(
        "SELECT TIMESTAMPDIFF(MINUTE, ?, NOW()) AS minFromStart",
        [t.start_time]
      );
      const showRoom = Number(minFromStart) >= -5 && Number(minFromStart) <= 5 && t.room_id;
      return {
        ...t,
        room_id: showRoom ? t.room_id : null,
        room_password: showRoom ? t.room_password : null,
      };
    })
  );

  return NextResponse.json({ tournaments: enriched });
}
